import type { Request, Response } from 'express';
import { Types, isValidObjectId } from 'mongoose';
import { DrillResponseModel } from '../models/drillResponse.model.js';
import { DrillSessionModel } from '../models/drillSession.model.js';
import { ExamAssignmentModel } from '../models/examAssignment.model.js';
import { QuestionModel } from '../models/question.model.js';
import { SubjectModel } from '../models/subject.model.js';
import { ApiError } from '../utils/http.js';

type SubmitAnswer = {
  questionId: string;
  selectedAnswer: 'A' | 'B' | 'C' | 'D';
};

async function resolveTargetDifficulty(
  studentId: string,
  subjectId: string,
): Promise<'Easy' | 'Average' | 'Difficult'> {
  const subjectObjectId = new Types.ObjectId(subjectId);

  const result = await DrillSessionModel.aggregate<{ avgScore: number }>([
    { $match: { studentId, subjectId: subjectObjectId } },
    { $group: { _id: null, avgScore: { $avg: '$accuracyPercentage' } } },
  ]);

  const avgScore = Number(result[0]?.avgScore ?? 0);

  if (avgScore >= 80) return 'Difficult';
  if (avgScore >= 50) return 'Average';
  return 'Easy';
}

export async function createDrillSession(req: Request, res: Response): Promise<void> {
  if (!req.user?.studentId) {
    throw new ApiError(403, 'Student account required');
  }

  const { subjectId, requestedDifficulty } = req.body as {
    subjectId?: string;
    requestedDifficulty?: 'Easy' | 'Average' | 'Difficult';
  };
  if (!subjectId || !isValidObjectId(subjectId)) {
    throw new ApiError(400, 'subjectId is required and must be valid');
  }

  const target =
    requestedDifficulty && ['Easy', 'Average', 'Difficult'].includes(requestedDifficulty)
      ? requestedDifficulty
      : await resolveTargetDifficulty(req.user.studentId, subjectId);
  const subjectObjectId = new Types.ObjectId(subjectId);

  const questions = await QuestionModel.aggregate([
    { $match: { subjectId: subjectObjectId, isActive: true, difficulty: target } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: {
          subjectId: '$subjectId',
          difficulty: '$difficulty',
          content: '$content',
        },
        doc: { $first: '$$ROOT' },
      },
    },
    { $replaceRoot: { newRoot: '$doc' } },
    { $sample: { size: 20 } },
    {
      $project: {
        topic: 1,
        difficulty: 1,
        content: 1,
        options: 1,
        correctAnswer: 1,
        referenceText: 1,
      },
    },
  ]);

  if (!questions.length) {
    throw new ApiError(404, 'No questions found for this subject');
  }

  const payload = questions.map((q) => ({
    id: q._id.toString(),
    topic: q.topic,
    difficulty: q.difficulty,
    content: q.content,
    options: q.options,
    correctAnswer: q.correctAnswer,
    reference: q.referenceText,
  }));

  res.json({ subjectId, targetDifficulty: target, totalQuestions: payload.length, questions: payload });
}

export async function submitDrillSession(req: Request, res: Response): Promise<void> {
  if (!req.user?.studentId) {
    throw new ApiError(403, 'Student account required');
  }

  const { subjectId, answers } = req.body as { subjectId?: string; answers?: SubmitAnswer[] };
  if (!subjectId || !answers?.length || !isValidObjectId(subjectId)) {
    throw new ApiError(400, 'subjectId and answers are required');
  }

  const ids = answers.map((a) => a.questionId).filter((id) => isValidObjectId(id));
  const rows = await QuestionModel.find({ _id: { $in: ids } }, { topic: 1, correctAnswer: 1, referenceText: 1 }).lean();
  const byId = new Map(rows.map((q) => [q._id.toString(), q]));

  let score = 0;
  const remedials: Array<{
    questionId: string;
    topic: string;
    correctAnswer: string;
    selectedAnswer: string;
    referenceText: string | null;
  }> = [];

  const responsePayload: Array<{
    studentId: string;
    questionId: string;
    selectedAnswer: 'A' | 'B' | 'C' | 'D';
    isCorrect: boolean;
  }> = [];

  for (const answer of answers) {
    const q = byId.get(answer.questionId);
    if (!q) continue;

    const isCorrect = q.correctAnswer === answer.selectedAnswer;
    if (isCorrect) score += 1;

    responsePayload.push({
      studentId: req.user.studentId,
      questionId: answer.questionId,
      selectedAnswer: answer.selectedAnswer,
      isCorrect,
    });

    if (!isCorrect) {
      remedials.push({
        questionId: answer.questionId,
        topic: q.topic,
        correctAnswer: q.correctAnswer,
        selectedAnswer: answer.selectedAnswer,
        referenceText: q.referenceText ?? null,
      });
    }
  }

  if (responsePayload.length) {
    await DrillResponseModel.insertMany(responsePayload);
  }

  const totalQuestions = answers.length;
  const accuracyPercentage = Number(((score / totalQuestions) * 100).toFixed(2));

  const sessionDifficulty = await resolveTargetDifficulty(req.user.studentId, subjectId);

  await DrillSessionModel.create({
    studentId: req.user.studentId,
    subjectId,
    score,
    totalQ: totalQuestions,
    accuracyPercentage,
    difficulty: sessionDifficulty,
  });

  res.json({
    subjectId,
    score,
    totalQuestions,
    accuracyPercentage,
    status: accuracyPercentage >= 75 ? 'Passed' : 'Remedial',
    remedials,
  });
}

export async function listAssignedDrillContent(req: Request, res: Response): Promise<void> {
  if (!req.user?.studentId) {
    throw new ApiError(403, 'Student account required');
  }

  const assignments = await ExamAssignmentModel.find(
    { studentId: req.user.studentId, isActive: true },
    { subjectId: 1, difficulty: 1, assignedAt: 1, assignedByFacultyEmail: 1 },
  )
    .sort({ assignedAt: -1 })
    .lean();

  if (!assignments.length) {
    res.json([]);
    return;
  }

  const latestBySubject = new Map<
    string,
    { assignedAt: Date; assignedByFacultyEmail: string | null; difficulties: Set<string> }
  >();

  for (const row of assignments) {
    const subjectId = row.subjectId.toString();
    const difficultyLabel = row.difficulty ?? 'Average';
    if (!latestBySubject.has(subjectId)) {
      latestBySubject.set(subjectId, {
        assignedAt: row.assignedAt,
        assignedByFacultyEmail: row.assignedByFacultyEmail ?? null,
        difficulties: new Set([difficultyLabel]),
      });
      continue;
    }

    latestBySubject.get(subjectId)?.difficulties.add(difficultyLabel);
  }

  const subjectIds = [...latestBySubject.keys()].map((id) => new Types.ObjectId(id));
  const subjects = await SubjectModel.find({ _id: { $in: subjectIds }, isActive: true }, { code: 1, name: 1 }).lean();

  const rows = await Promise.all(
    subjects.map(async (subject) => {
      const subjectId = subject._id.toString();
      const questionCount = await QuestionModel.countDocuments({ subjectId, isActive: true });
      const assignment = latestBySubject.get(subjectId);

      return {
        subjectId,
        code: subject.code,
        name: subject.name,
        questionCount,
        difficulties: [...(assignment?.difficulties ?? new Set<string>())],
        assignedAt: assignment?.assignedAt ?? null,
        assignedByFacultyEmail: assignment?.assignedByFacultyEmail ?? null,
      };
    }),
  );

  res.json(rows.filter((row) => row.questionCount > 0));
}
