import type { Request, Response } from 'express';
import { AnnouncementModel } from '../models/announcement.model.js';
import { UserModel } from '../models/user.model.js';
import { ApiError } from '../utils/http.js';

export async function listAnnouncements(req: Request, res: Response): Promise<void> {
  const role = req.user!.role;
  const docs = await AnnouncementModel.find({
    isActive: true,
    $or: [{ targetRoles: role }, { authorId: req.user!.userId }],
  })
    .sort({ createdAt: -1 })
    .lean();

  res.json(
    docs.map((a) => ({
      id: (a._id as { toString(): string }).toString(),
      title: a.title,
      content: a.content,
      authorName: a.authorName,
      authorRole: a.authorRole,
      targetRoles: a.targetRoles,
      createdAt: a.createdAt,
    })),
  );
}

export async function createAnnouncement(req: Request, res: Response): Promise<void> {
  const { title, content, targetRoles } = req.body as {
    title: string;
    content: string;
    targetRoles?: string[];
  };

  if (!title?.trim() || !content?.trim()) {
    throw new ApiError(400, 'title and content are required');
  }

  // Enforce role-based announcement chain:
  // ADMIN can only announce to FACULTY
  // FACULTY can only announce to STUDENT
  let targets: string[] = [];
  if (req.user!.role === 'ADMIN') {
    targets = ['FACULTY'];
  } else if (req.user!.role === 'FACULTY') {
    targets = ['STUDENT'];
  } else {
    throw new ApiError(403, 'Only ADMIN and FACULTY can create announcements');
  }

  const author = await UserModel.findById(req.user!.userId).lean();
  const authorName = author?.name ?? req.user!.email;
  const authorEmail = author?.email ?? req.user!.email;

  const doc = await AnnouncementModel.create({
    title: title.trim(),
    content: content.trim(),
    authorId: req.user!.userId,
    authorName,
    authorEmail,
    authorRole: req.user!.role,
    targetRoles: targets,
    isActive: true,
  });

  res.status(201).json({
    id: (doc._id as { toString(): string }).toString(),
    message: 'Announcement posted',
  });
}

export async function deleteAnnouncement(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const doc = await AnnouncementModel.findById(id);
  if (!doc) throw new ApiError(404, 'Announcement not found');

  if (req.user!.role !== 'ADMIN' && doc.authorId !== req.user!.userId) {
    throw new ApiError(403, 'You can only delete your own announcements');
  }

  await AnnouncementModel.findByIdAndDelete(id);
  res.json({ message: 'Announcement deleted' });
}
