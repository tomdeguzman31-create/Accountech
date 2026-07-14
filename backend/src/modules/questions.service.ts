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
  const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : null;

  const filter: Record<string, unknown> = {};
  if (subjectId) filter.subjectId = subjectId;
  if (difficulty) filter.difficulty = difficulty;
  if (isActive !== null) filter.isActive = isActive;

  const rows = await QuestionModel.find(filter)
    .populate('subjectId', 'code name')
    .sort({ createdAt: -1 })
    .lean();

  res.json(
    rows.map((row) => ({
      id: row._id.toString(),
      subjectId: (row.subjectId as { _id: { toString(): string } })?._id?.toString() ?? '',
      subjectCode: (row.subjectId as { code: string })?.code ?? '',
      topic: row.topic,
      difficulty: row.difficulty,
      content: row.content,
      optionA: row.options?.A ?? '',
      optionB: row.options?.B ?? '',
      optionC: row.options?.C ?? '',
      optionD: row.options?.D ?? '',
      correctAnswer: row.correctAnswer,
      referenceText: row.referenceText,
      isActive: row.isActive,
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

export async function updateQuestion(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { id } = req.params;
  const updates = req.body as Partial<NewQuestion & { isActive: boolean }>;

  if (!id || !isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid question ID');
  }

  const formattedUpdates: Record<string, any> = {};
  if (updates.subjectId) {
    if (!isValidObjectId(updates.subjectId)) {
      throw new ApiError(400, 'subjectId must be a valid ObjectId');
    }
    formattedUpdates.subjectId = updates.subjectId;
  }
  if (updates.topic) formattedUpdates.topic = updates.topic;
  if (updates.difficulty) formattedUpdates.difficulty = updates.difficulty;
  if (updates.content) formattedUpdates.content = updates.content;
  if (updates.options) {
    formattedUpdates.options = {
      A: updates.options.A,
      B: updates.options.B,
      C: updates.options.C,
      D: updates.options.D,
    };
  }
  if (updates.correctAnswer) formattedUpdates.correctAnswer = updates.correctAnswer;
  if (updates.referenceText !== undefined) formattedUpdates.referenceText = updates.referenceText;
  if (updates.isActive !== undefined) formattedUpdates.isActive = updates.isActive;

  const updated = await QuestionModel.findByIdAndUpdate(id, { $set: formattedUpdates }, { new: true });
  if (!updated) {
    throw new ApiError(404, 'Question not found');
  }

  res.json({ message: 'Question updated successfully', question: updated });
}

export async function deleteQuestion(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { id } = req.params;
  if (!id || !isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid question ID');
  }

  const result = await QuestionModel.findByIdAndDelete(id);
  if (!result) {
    throw new ApiError(404, 'Question not found');
  }

  res.json({ message: 'Question deleted successfully' });
}

