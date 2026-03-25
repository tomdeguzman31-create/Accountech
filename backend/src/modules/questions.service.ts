import type { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { QuestionModel } from '../models/question.model.js';
import { ApiError } from '../utils/http.js';

type NewQuestion = {
  subjectId: string;
  topic: string;
  difficulty?: 'Easy' | 'Average' | 'Difficult';
  content: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  referenceText?: string;
};

function validateQuestion(payload: NewQuestion): void {
  if (!payload.subjectId || !payload.topic || !payload.content || !payload.options || !payload.correctAnswer) {
    throw new ApiError(400, 'Invalid question payload');
  }

  if (!isValidObjectId(payload.subjectId)) {
    throw new ApiError(400, 'subjectId must be a valid ObjectId');
  }
}

async function insertOne(question: NewQuestion, createdBy: string): Promise<void> {
  validateQuestion(question);

  await QuestionModel.findOneAndUpdate(
    {
      subjectId: question.subjectId,
      content: question.content,
    },
    {
      $set: {
        topic: question.topic,
        difficulty: question.difficulty ?? 'Average',
        options: {
          A: question.options.A,
          B: question.options.B,
          C: question.options.C,
          D: question.options.D,
        },
        correctAnswer: question.correctAnswer,
        referenceText: question.referenceText ?? null,
        createdBy,
        isActive: true,
      },
      $setOnInsert: {
        subjectId: question.subjectId,
        content: question.content,
      },
    },
    { upsert: true, new: true },
  );
}

export async function listQuestions(req: Request, res: Response): Promise<void> {
  const subjectId = req.query.subjectId ? String(req.query.subjectId) : null;
  const difficulty = req.query.difficulty ? String(req.query.difficulty) : null;

  const filter: Record<string, unknown> = { isActive: true };
  if (subjectId) filter.subjectId = subjectId;
  if (difficulty) filter.difficulty = difficulty;

  const rows = await QuestionModel.find(filter)
    .populate('subjectId', 'code name')
    .sort({ createdAt: -1 })
    .lean();

  res.json(
    rows.map((row) => ({
      id: row._id.toString(),
      subjectId: (row.subjectId as { _id: { toString(): string } })._id.toString(),
      subjectCode: (row.subjectId as { code: string }).code,
      topic: row.topic,
      difficulty: row.difficulty,
      content: row.content,
      optionA: row.options?.A ?? '',
      optionB: row.options?.B ?? '',
      optionC: row.options?.C ?? '',
      optionD: row.options?.D ?? '',
      correctAnswer: row.correctAnswer,
      referenceText: row.referenceText,
    })),
  );
}

export async function createQuestion(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized');
  }

  await insertOne(req.body as NewQuestion, req.user.userId);
  res.status(201).json({ message: 'Question created' });
}

export async function createQuestionsBulk(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { questions } = req.body as { questions?: NewQuestion[] };
  if (!questions?.length) {
    throw new ApiError(400, 'questions array is required');
  }

  for (const q of questions) {
    await insertOne(q, req.user.userId);
  }

  res.status(201).json({ message: `${questions.length} questions inserted` });
}
