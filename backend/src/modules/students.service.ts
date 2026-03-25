import type { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { AllowedStudentModel } from '../models/allowedStudent.model.js';
import { DrillSessionModel } from '../models/drillSession.model.js';
import { ExamAssignmentModel } from '../models/examAssignment.model.js';
import { QuestionModel } from '../models/question.model.js';
import { ApiError } from '../utils/http.js';

type AllowedStudentInput = {
  studentId: string;
  email: string;
  section?: string;
  department?: string;
  enrolledByFacultyUserId?: string;
  enrolledByFacultyEmail?: string;
};

export async function listAllowedStudents(req: Request, res: Response): Promise<void> {
  const filter: Record<string, unknown> = {};
  if (req.user?.role === 'FACULTY') {
    filter.enrolledByFacultyUserId = req.user.userId;
  }

  const rows = await AllowedStudentModel.find(
    filter,
    {
      studentId: 1,
      phinmaEmail: 1,
      isRegistered: 1,
      section: 1,
      department: 1,
      enrolledByFacultyEmail: 1,
    },
  )
    .sort({ studentId: 1 })
    .lean();

  const withAccuracy = await Promise.all(
    rows.map(async (row) => {
      const agg = await DrillSessionModel.aggregate<{ avgAccuracy: number }>([
        { $match: { studentId: row.studentId } },
        { $group: { _id: null, avgAccuracy: { $avg: '$accuracyPercentage' } } },
      ]);

      return {
        studentId: row.studentId,
        email: row.phinmaEmail,
        isRegistered: row.isRegistered,
        section: row.section ?? undefined,
        department: row.department ?? undefined,
        enrolledByFacultyEmail: row.enrolledByFacultyEmail ?? undefined,
        accuracyScore: Number((agg[0]?.avgAccuracy ?? 0).toFixed(2)),
      };
    }),
  );

  res.json(withAccuracy);
}

export async function bulkEnrollStudents(req: Request, res: Response): Promise<void> {
  const { students } = req.body as { students?: AllowedStudentInput[] };

  if (!students?.length) {
    throw new ApiError(400, 'students array is required');
  }

  let created = 0;

  for (const student of students) {
    if (!student.studentId || !student.email) {
      continue;
    }

    const normalizedSection = student.section?.trim() || null;
    const normalizedDepartment = student.department?.trim() || null;
    const isFaculty = req.user?.role === 'FACULTY';
    const enrolledByFacultyUserId =
      student.enrolledByFacultyUserId ?? (isFaculty ? req.user?.userId ?? null : null);
    const enrolledByFacultyEmail =
      student.enrolledByFacultyEmail ?? (isFaculty ? req.user?.email ?? null : null);

    const result = await AllowedStudentModel.updateOne(
      { studentId: student.studentId },
      {
        $set: {
          phinmaEmail: student.email.toLowerCase().trim(),
          section: normalizedSection,
          department: normalizedDepartment,
          enrolledByFacultyUserId,
          enrolledByFacultyEmail,
        },
        $setOnInsert: {
          isRegistered: false,
          enrolledAt: new Date(),
        },
      },
      { upsert: true },
    );

    if (result.upsertedCount > 0) {
      created += 1;
    }
  }

  res.status(201).json({ message: `${created} students enrolled/updated` });
}

export async function removeAllowedStudent(req: Request, res: Response): Promise<void> {
  const { studentId } = req.params;
  if (!studentId) {
    throw new ApiError(400, 'studentId is required');
  }

  await AllowedStudentModel.deleteOne({ studentId });
  res.json({ message: 'Student removed from whitelist' });
}

export async function assignExamContent(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { subjectIds, studentIds, placements } = req.body as {
    subjectIds?: string[];
    studentIds?: string[];
    placements?: Array<{ subjectId: string; difficulty?: 'Easy' | 'Average' | 'Difficult' }>;
  };

  if (!subjectIds?.length && !placements?.length) {
    throw new ApiError(400, 'subjectIds or placements is required');
  }

  const normalizedPlacements = placements
    ?.filter((item) => isValidObjectId(item.subjectId))
    .map((item) => ({
      subjectId: item.subjectId,
      difficulty:
        item.difficulty && ['Easy', 'Average', 'Difficult'].includes(item.difficulty)
          ? item.difficulty
          : undefined,
    }));

  const fallbackPlacements = [...new Set(subjectIds ?? [])]
    .filter((id) => isValidObjectId(id))
    .map((subjectId) => ({ subjectId, difficulty: undefined as 'Easy' | 'Average' | 'Difficult' | undefined }));

  const placementMap = new Map<string, { subjectId: string; difficulty?: 'Easy' | 'Average' | 'Difficult' }>();
  [...(normalizedPlacements ?? []), ...fallbackPlacements].forEach((placement) => {
    const key = `${placement.subjectId}::${placement.difficulty ?? 'ANY'}`;
    placementMap.set(key, placement);
  });

  const uniquePlacements = [...placementMap.values()];
  if (!uniquePlacements.length) {
    throw new ApiError(400, 'At least one valid subject placement is required');
  }

  const rosterFilter: Record<string, unknown> = {};

  if (req.user.role === 'FACULTY') {
    rosterFilter.enrolledByFacultyUserId = req.user.userId;
  }

  if (studentIds?.length) {
    rosterFilter.studentId = { $in: [...new Set(studentIds)] };
  }

  const rosterRows = await AllowedStudentModel.find(rosterFilter, { studentId: 1 }).lean();
  const uniqueStudentIds = [...new Set(rosterRows.map((row) => row.studentId))];

  if (!uniqueStudentIds.length) {
    throw new ApiError(400, 'No enrolled students found for assignment');
  }

  const eligiblePlacements: Array<{ subjectId: string; difficulty?: 'Easy' | 'Average' | 'Difficult' }> = [];
  for (const placement of uniquePlacements) {
    const filter: Record<string, unknown> = { subjectId: placement.subjectId, isActive: true };
    if (placement.difficulty) {
      filter.difficulty = placement.difficulty;
    }

    const count = await QuestionModel.countDocuments(filter);
    if (count > 0) {
      eligiblePlacements.push(placement);
    }
  }

  if (!eligiblePlacements.length) {
    throw new ApiError(400, 'Selected subject/difficulty placements do not have active questions yet');
  }

  let upserts = 0;

  for (const studentId of uniqueStudentIds) {
    for (const placement of eligiblePlacements) {
      const result = await ExamAssignmentModel.updateOne(
        {
          studentId,
          subjectId: placement.subjectId,
          difficulty: placement.difficulty ?? null,
          assignedByFacultyUserId: req.user.userId,
        },
        {
          $set: {
            assignedByFacultyEmail: req.user.email,
            assignedAt: new Date(),
            isActive: true,
            difficulty: placement.difficulty ?? null,
          },
          $setOnInsert: {
            studentId,
            subjectId: placement.subjectId,
            difficulty: placement.difficulty ?? null,
            assignedByFacultyUserId: req.user.userId,
          },
        },
        { upsert: true },
      );

      if (result.upsertedCount > 0 || result.modifiedCount > 0) {
        upserts += 1;
      }
    }
  }

  res.status(201).json({
    message: 'Exam content assigned successfully',
    studentsAffected: uniqueStudentIds.length,
    subjectsAssigned: eligiblePlacements.length,
    recordsUpserted: upserts,
  });
}
