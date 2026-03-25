import type { Request, Response } from 'express';
import { SubjectModel } from '../models/subject.model.js';
import { ApiError } from '../utils/http.js';

export async function listSubjects(_req: Request, res: Response): Promise<void> {
  const rows = await SubjectModel.find({}, { code: 1, name: 1, isActive: 1, createdAt: 1 })
    .sort({ name: 1 })
    .lean();
  res.json(
    rows.map((row) => ({
      id: row._id.toString(),
      code: row.code,
      name: row.name,
      isActive: row.isActive,
      createdAt: row.createdAt,
    })),
  );
}

export async function createSubject(req: Request, res: Response): Promise<void> {
  const { code, name } = req.body as { code?: string; name?: string };

  if (!code || !name) {
    throw new ApiError(400, 'code and name are required');
  }

  await SubjectModel.create({ code: code.toUpperCase(), name });
  res.status(201).json({ message: 'Subject created' });
}

export async function updateSubject(req: Request, res: Response): Promise<void> {
  const id = req.params.id;
  const { code, name, isActive } = req.body as {
    code?: string;
    name?: string;
    isActive?: boolean;
  };

  if (!id) {
    throw new ApiError(400, 'Invalid subject id');
  }

  await SubjectModel.findByIdAndUpdate(id, {
    ...(code ? { code: code.toUpperCase() } : {}),
    ...(name ? { name } : {}),
    ...(typeof isActive === 'boolean' ? { isActive } : {}),
  });

  res.json({ message: 'Subject updated' });
}

export async function deleteSubject(req: Request, res: Response): Promise<void> {
  const id = req.params.id;
  if (!id) {
    throw new ApiError(400, 'Invalid subject id');
  }

  await SubjectModel.findByIdAndUpdate(id, { isActive: false });
  res.json({ message: 'Subject archived' });
}
