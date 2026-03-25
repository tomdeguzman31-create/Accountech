import type { Request, Response } from 'express';
import { AllowedStudentModel } from '../models/allowedStudent.model.js';
import { DrillSessionModel } from '../models/drillSession.model.js';
import { ExamAssignmentModel } from '../models/examAssignment.model.js';
import { UserModel } from '../models/user.model.js';
import { ApiError } from '../utils/http.js';

type BatchTrendRow = {
  batchYear: number;
  batchLabel: string;
  studentCount: number;
  averageAccuracy: number;
  completionRate: number;
  passingLikelihood: number;
};

function clampScore(value: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Number(value.toFixed(2));
}

function getBatchYearFromDate(dateValue: Date | null | undefined): number {
  if (!dateValue) return new Date().getFullYear();
  const year = new Date(dateValue).getFullYear();
  if (Number.isNaN(year)) return new Date().getFullYear();
  return year;
}

export async function readinessReport(req: Request, res: Response): Promise<void> {
  if (!req.user || req.user.role !== 'ADMIN') {
    throw new ApiError(403, 'Admin role required');
  }

  const currentYear = new Date().getFullYear();
  const trackedYears = [2022, 2023, 2024, currentYear];

  const [rosterRows, assignmentRows, sessionRows, facultyUsers] = await Promise.all([
    AllowedStudentModel.find(
      {},
      { studentId: 1, enrolledByFacultyUserId: 1, enrolledByFacultyEmail: 1, enrolledAt: 1 },
    ).lean(),
    ExamAssignmentModel.find(
      { isActive: true },
      { studentId: 1, subjectId: 1, difficulty: 1, assignedByFacultyUserId: 1, assignedAt: 1 },
    ).lean(),
    DrillSessionModel.find(
      {},
      { studentId: 1, subjectId: 1, difficulty: 1, accuracyPercentage: 1 },
    ).lean(),
    UserModel.find({ role: 'FACULTY' }, { _id: 1, name: 1, email: 1 }).lean(),
  ]);

  const rosterStudentIds = rosterRows.map((row) => row.studentId);

  const studentBatchMap = new Map<string, number>();
  for (const row of rosterRows) {
    studentBatchMap.set(row.studentId, getBatchYearFromDate(row.enrolledAt ?? null));
  }

  const studentAccRows = await DrillSessionModel.aggregate<{ studentId: string; averageAccuracy: number }>([
    ...(rosterStudentIds.length ? [{ $match: { studentId: { $in: rosterStudentIds } } }] : []),
    {
      $group: {
        _id: '$studentId',
        averageAccuracy: { $avg: '$accuracyPercentage' },
      },
    },
    {
      $project: {
        _id: 0,
        studentId: '$_id',
        averageAccuracy: { $round: ['$averageAccuracy', 2] },
      },
    },
  ]);

  const studentAverageMap = new Map(studentAccRows.map((row) => [row.studentId, row.averageAccuracy]));

  const completedExactByStudent = new Map<string, Set<string>>();
  const completedSubjectByStudent = new Map<string, Set<string>>();
  for (const session of sessionRows) {
    const subjectId = session.subjectId.toString();
    const exactKey = `${subjectId}::${session.difficulty ?? 'ANY'}`;

    if (!completedExactByStudent.has(session.studentId)) completedExactByStudent.set(session.studentId, new Set());
    if (!completedSubjectByStudent.has(session.studentId)) completedSubjectByStudent.set(session.studentId, new Set());

    completedExactByStudent.get(session.studentId)?.add(exactKey);
    completedSubjectByStudent.get(session.studentId)?.add(subjectId);
  }

  const completionMetricsByStudent = new Map<string, { totalAssigned: number; completedAssigned: number }>();
  for (const assignment of assignmentRows) {
    const studentId = assignment.studentId;
    const subjectId = assignment.subjectId.toString();
    const key = `${subjectId}::${assignment.difficulty ?? 'ANY'}`;

    const current = completionMetricsByStudent.get(studentId) ?? { totalAssigned: 0, completedAssigned: 0 };
    current.totalAssigned += 1;

    if (assignment.difficulty) {
      if (completedExactByStudent.get(studentId)?.has(key)) {
        current.completedAssigned += 1;
      }
    } else if (completedSubjectByStudent.get(studentId)?.has(subjectId)) {
      current.completedAssigned += 1;
    }

    completionMetricsByStudent.set(studentId, current);
  }

  const facultyById = new Map(facultyUsers.map((row) => [row._id.toString(), row]));

  const studentsByFaculty = new Map<string, string[]>();
  for (const row of rosterRows) {
    if (!row.enrolledByFacultyUserId) continue;
    const existing = studentsByFaculty.get(row.enrolledByFacultyUserId) ?? [];
    existing.push(row.studentId);
    studentsByFaculty.set(row.enrolledByFacultyUserId, existing);
  }

  const assignmentByFaculty = new Map<string, { totalDrillsUploaded: number; lastActivityAt: Date | null }>();
  for (const assignment of assignmentRows) {
    const facultyId = assignment.assignedByFacultyUserId;
    const existing = assignmentByFaculty.get(facultyId) ?? { totalDrillsUploaded: 0, lastActivityAt: null };
    existing.totalDrillsUploaded += 1;
    if (!existing.lastActivityAt || assignment.assignedAt > existing.lastActivityAt) {
      existing.lastActivityAt = assignment.assignedAt;
    }
    assignmentByFaculty.set(facultyId, existing);
  }

  const facultyOverview = [...studentsByFaculty.entries()].map(([facultyUserId, studentIds]) => {
    const uniqueStudentIds = [...new Set(studentIds)];
    const averageClassReadiness =
      uniqueStudentIds.length > 0
        ? clampScore(
            uniqueStudentIds.reduce((sum, studentId) => sum + Number(studentAverageMap.get(studentId) ?? 0), 0) /
              uniqueStudentIds.length,
          )
        : 0;

    const faculty = facultyById.get(facultyUserId);
    const assignmentMeta = assignmentByFaculty.get(facultyUserId) ?? { totalDrillsUploaded: 0, lastActivityAt: null };

    return {
      facultyUserId,
      facultyName: faculty?.name ?? 'Unassigned Faculty',
      facultyEmail: faculty?.email ?? null,
      totalStudentsHandled: uniqueStudentIds.length,
      averageClassReadiness,
      totalDrillsUploaded: assignmentMeta.totalDrillsUploaded,
      lastActivityAt: assignmentMeta.lastActivityAt,
    };
  }).sort((a, b) => b.averageClassReadiness - a.averageClassReadiness);

  const buildBatchRow = (year: number): BatchTrendRow => {
    const batchStudentIds = rosterRows
      .filter((row) => studentBatchMap.get(row.studentId) === year)
      .map((row) => row.studentId);

    const studentCount = batchStudentIds.length;
    const accuracySum = batchStudentIds.reduce((sum, studentId) => sum + Number(studentAverageMap.get(studentId) ?? 0), 0);
    const averageAccuracy = studentCount > 0 ? clampScore(accuracySum / studentCount) : 0;

    const passers = batchStudentIds.filter((studentId) => Number(studentAverageMap.get(studentId) ?? 0) >= 75).length;
    const passRate = studentCount > 0 ? clampScore((passers / studentCount) * 100) : 0;

    const batchCompletion = batchStudentIds.reduce(
      (acc, studentId) => {
        const metric = completionMetricsByStudent.get(studentId) ?? { totalAssigned: 0, completedAssigned: 0 };
        return {
          totalAssigned: acc.totalAssigned + metric.totalAssigned,
          completedAssigned: acc.completedAssigned + metric.completedAssigned,
        };
      },
      { totalAssigned: 0, completedAssigned: 0 },
    );

    const completionRate =
      batchCompletion.totalAssigned > 0
        ? clampScore((batchCompletion.completedAssigned / batchCompletion.totalAssigned) * 100)
        : 0;

    const passingLikelihood = clampScore(passRate * 0.5 + averageAccuracy * 0.35 + completionRate * 0.15);

    return {
      batchYear: year,
      batchLabel: year === currentYear ? `${year} (Current)` : String(year),
      studentCount,
      averageAccuracy,
      completionRate,
      passingLikelihood,
    };
  };

  const historicalTrend = trackedYears.map((year) => buildBatchRow(year));
  const currentBatch = historicalTrend.find((row) => row.batchYear === currentYear) ?? buildBatchRow(currentYear);

  const passersCurrent = rosterRows
    .filter((row) => studentBatchMap.get(row.studentId) === currentYear)
    .filter((row) => Number(studentAverageMap.get(row.studentId) ?? 0) >= 75).length;

  const currentBatchTotal = rosterRows.filter((row) => studentBatchMap.get(row.studentId) === currentYear).length;
  const currentBatchPassRate = currentBatchTotal > 0 ? clampScore((passersCurrent / currentBatchTotal) * 100) : 0;

  const globalReadiness = {
    boardPassingLikelihood: currentBatch.passingLikelihood,
    currentBatchYear: currentYear,
    components: {
      passRateWeight: 0.5,
      accuracyWeight: 0.35,
      completionWeight: 0.15,
      averageAccuracy: currentBatch.averageAccuracy,
      completionRate: currentBatch.completionRate,
      passRate: currentBatchPassRate,
    },
  };

  res.json({
    generatedAt: new Date().toISOString(),
    readinessMath:
      'Board Passing Likelihood = (Pass Rate x 0.50) + (Average Accuracy x 0.35) + (Completion Rate x 0.15)',
    globalReadiness,
    historicalTrend,
    facultyOverview,
  });
}
