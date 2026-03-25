import type { Request, Response } from 'express';
import { Types, isValidObjectId } from 'mongoose';
import { AllowedStudentModel } from '../models/allowedStudent.model.js';
import { DrillResponseModel } from '../models/drillResponse.model.js';
import { DrillSessionModel } from '../models/drillSession.model.js';
import { ExamAssignmentModel } from '../models/examAssignment.model.js';
import { SubjectModel } from '../models/subject.model.js';
import { UserModel } from '../models/user.model.js';
import { ApiError } from '../utils/http.js';

type LeaderboardScope = 'FACULTY' | 'SECTION' | 'DEPARTMENT' | 'GLOBAL';

const AT_RISK_ACCURACY_BELOW = 60;
const AT_RISK_COMPLETION_BELOW = 40;

function normalizeScope(rawScope: string | undefined, fallback: LeaderboardScope): LeaderboardScope {
  if (!rawScope) return fallback;
  const normalized = rawScope.toUpperCase();
  if (normalized === 'FACULTY' || normalized === 'SECTION' || normalized === 'DEPARTMENT' || normalized === 'GLOBAL') {
    return normalized;
  }
  return fallback;
}

function parseFilterDate(raw: string | undefined): Date | null {
  const input = raw?.trim();
  if (!input) return null;

  // Accept dd,mm,yy or dd/mm/yyyy (also supports '-' and '.')
  const dmyMatch = input.match(/^(\d{1,2})[\/,.-](\d{1,2})[\/,.-](\d{2}|\d{4})$/);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]);
    const parsedYear = Number(dmyMatch[3]);
    const year = dmyMatch[3].length === 2 ? 2000 + parsedYear : parsedYear;

    const candidate = new Date(year, month - 1, day);
    const isValid =
      candidate.getFullYear() === year &&
      candidate.getMonth() === month - 1 &&
      candidate.getDate() === day;

    return isValid ? candidate : null;
  }

  // Fallback to native parsing for ISO-style values like yyyy-mm-dd.
  const isoCandidate = new Date(input);
  return Number.isNaN(isoCandidate.getTime()) ? null : isoCandidate;
}

export async function myProgress(req: Request, res: Response): Promise<void> {
  if (!req.user?.studentId) {
    throw new ApiError(403, 'Student account required');
  }

  const sessions = await DrillSessionModel.find({ studentId: req.user.studentId })
    .populate('subjectId', 'code name')
    .sort({ takenAt: -1 })
    .lean();

  const summaryRows = await DrillSessionModel.aggregate<{
    overallAccuracy: number;
    totalSessions: number;
    passedSessions: number;
  }>([
    { $match: { studentId: req.user.studentId } },
    {
      $group: {
        _id: null,
        overallAccuracy: { $avg: '$accuracyPercentage' },
        totalSessions: { $sum: 1 },
        passedSessions: {
          $sum: {
            $cond: [{ $gte: ['$accuracyPercentage', 75] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        overallAccuracy: { $round: ['$overallAccuracy', 2] },
        totalSessions: 1,
        passedSessions: 1,
      },
    },
  ]);

  res.json({
    summary: summaryRows[0] ?? { overallAccuracy: 0, totalSessions: 0, passedSessions: 0 },
    sessions: sessions.map((ds) => ({
      id: ds._id.toString(),
      subjectId: (ds.subjectId as { _id: { toString(): string } })._id.toString(),
      subjectCode: (ds.subjectId as { code: string }).code,
      subjectName: (ds.subjectId as { name: string }).name,
      score: ds.score,
      totalQuestions: ds.totalQ,
      accuracyPercentage: ds.accuracyPercentage,
      takenAt: ds.takenAt,
    })),
  });
}

export async function deanOverview(_req: Request, res: Response): Promise<void> {
  const subjects = await SubjectModel.find({ isActive: true }, { code: 1, name: 1 }).lean();

  const subjectAverages = await Promise.all(
    subjects.map(async (subject) => {
      const agg = await DrillSessionModel.aggregate<{ avgAccuracy: number; totalSessions: number }>([
        { $match: { subjectId: subject._id } },
        {
          $group: {
            _id: null,
            avgAccuracy: { $avg: '$accuracyPercentage' },
            totalSessions: { $sum: 1 },
          },
        },
      ]);

      return {
        subjectCode: subject.code,
        subjectName: subject.name,
        avgAccuracy: Number((agg[0]?.avgAccuracy ?? 0).toFixed(2)),
        totalSessions: agg[0]?.totalSessions ?? 0,
      };
    }),
  );

  subjectAverages.sort((a, b) => b.avgAccuracy - a.avgAccuracy);

  const topStudentsAgg = await DrillSessionModel.aggregate<{
    studentId: string;
    avgAccuracy: number;
    sessionsTaken: number;
  }>([
    {
      $group: {
        _id: '$studentId',
        avgAccuracy: { $avg: '$accuracyPercentage' },
        sessionsTaken: { $sum: 1 },
      },
    },
    { $sort: { avgAccuracy: -1 } },
    { $limit: 10 },
    {
      $project: {
        _id: 0,
        studentId: '$_id',
        avgAccuracy: { $round: ['$avgAccuracy', 2] },
        sessionsTaken: 1,
      },
    },
  ]);

  const userMap = new Map(
    (
      await UserModel.find(
        { role: 'STUDENT', studentId: { $in: topStudentsAgg.map((s) => s.studentId) } },
        { name: 1, studentId: 1 },
      ).lean()
    ).map((u) => [u.studentId, u.name]),
  );

  const topStudents = topStudentsAgg.map((student) => ({
    name: userMap.get(student.studentId) ?? student.studentId,
    studentId: student.studentId,
    avgAccuracy: student.avgAccuracy,
    sessionsTaken: student.sessionsTaken,
  }));

  const [totalAllowedStudents, registeredStudents, activeStudents] = await Promise.all([
    AllowedStudentModel.countDocuments({}),
    AllowedStudentModel.countDocuments({ isRegistered: true }),
    DrillSessionModel.distinct('studentId').then((ids) => ids.length),
  ]);

  res.json({
    subjectAverages,
    topStudents,
    engagement: {
      totalAllowedStudents,
      registeredStudents,
      activeStudents,
    },
  });
}

export async function facultyRosterReadiness(_req: Request, res: Response): Promise<void> {
  const roster = await AllowedStudentModel.find(
    {
      $or: [
        { enrolledByFacultyUserId: { $ne: null } },
        { enrolledByFacultyEmail: { $ne: null } },
      ],
    },
    {
      studentId: 1,
      enrolledByFacultyUserId: 1,
      enrolledByFacultyEmail: 1,
    },
  ).lean();

  if (!roster.length) {
    res.json({ items: [] });
    return;
  }

  const studentAccuracyRows = await DrillSessionModel.aggregate<{
    studentId: string;
    avgAccuracy: number;
  }>([
    {
      $group: {
        _id: '$studentId',
        avgAccuracy: { $avg: '$accuracyPercentage' },
      },
    },
    {
      $project: {
        _id: 0,
        studentId: '$_id',
        avgAccuracy: { $round: ['$avgAccuracy', 2] },
      },
    },
  ]);

  const studentAccuracyMap = new Map(studentAccuracyRows.map((row) => [row.studentId, row.avgAccuracy]));

  type FacultyBucket = {
    facultyUserId: string | null;
    facultyEmail: string | null;
    scores: number[];
  };

  const buckets = new Map<string, FacultyBucket>();

  for (const row of roster) {
    const facultyUserId = row.enrolledByFacultyUserId ?? null;
    const facultyEmail = row.enrolledByFacultyEmail ?? null;
    const key = facultyUserId || facultyEmail;
    if (!key) continue;

    const rawScore = Number(studentAccuracyMap.get(row.studentId) ?? 0);
    const score = Number.isFinite(rawScore) ? Math.max(0, Math.min(100, rawScore)) : 0;

    const bucket = buckets.get(key);
    if (bucket) {
      bucket.scores.push(score);
    } else {
      buckets.set(key, {
        facultyUserId,
        facultyEmail,
        scores: [score],
      });
    }
  }

  const validFacultyObjectIds = [...new Set(
    [...buckets.values()]
      .map((bucket) => bucket.facultyUserId)
      .filter((id): id is string => Boolean(id && isValidObjectId(id))),
  )].map((id) => new Types.ObjectId(id));

  const facultyUsers = validFacultyObjectIds.length
    ? await UserModel.find(
        { _id: { $in: validFacultyObjectIds }, role: 'FACULTY' },
        { _id: 1, email: 1, name: 1 },
      ).lean()
    : [];

  const facultyById = new Map(facultyUsers.map((u) => [u._id.toString(), u]));
  const facultyByEmail = new Map(facultyUsers.map((u) => [u.email, u]));

  const items = [...buckets.values()]
    .map((bucket) => {
      const rosterSize = bucket.scores.length;
      const totalScore = bucket.scores.reduce((acc, score) => acc + score, 0);
      const overallReadiness = rosterSize ? Number((totalScore / rosterSize).toFixed(2)) : 0;
      const pendingCount = bucket.scores.filter((score) => score === 0).length;
      const atRiskCount = bucket.scores.filter((score) => score > 0 && score < 50).length;
      const developingCount = bucket.scores.filter((score) => score >= 50 && score < 75).length;
      const readyCount = bucket.scores.filter((score) => score >= 75).length;

      const facultyFromId = bucket.facultyUserId ? facultyById.get(bucket.facultyUserId) : undefined;
      const facultyFromEmail = bucket.facultyEmail ? facultyByEmail.get(bucket.facultyEmail) : undefined;
      const faculty = facultyFromId ?? facultyFromEmail;

      return {
        facultyUserId: bucket.facultyUserId,
        facultyEmail: bucket.facultyEmail ?? faculty?.email ?? null,
        facultyName: faculty?.name ?? bucket.facultyEmail ?? 'Unassigned Faculty',
        rosterSize,
        overallReadiness,
        pendingCount,
        atRiskCount,
        developingCount,
        readyCount,
      };
    })
    .sort((a, b) => b.overallReadiness - a.overallReadiness);

  res.json({ items });
}

export async function facultyInstructionalReport(req: Request, res: Response): Promise<void> {
  const actor = req.user;
  if (!actor) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (actor.role !== 'FACULTY' && actor.role !== 'ADMIN') {
    throw new ApiError(403, 'Faculty or Admin role required');
  }

  const targetFacultyUserId =
    actor.role === 'ADMIN'
      ? ((req.query.facultyUserId as string | undefined)?.trim() || actor.userId)
      : actor.userId;

  const rosterRows = await AllowedStudentModel.find(
    { enrolledByFacultyUserId: targetFacultyUserId },
    { studentId: 1, section: 1, department: 1 },
  ).lean();

  const rosterStudentIds = rosterRows.map((row) => row.studentId);
  if (!rosterStudentIds.length) {
    res.json({
      generatedAt: new Date().toISOString(),
      thresholds: { atRiskAccuracyBelow: AT_RISK_ACCURACY_BELOW, atRiskCompletionBelow: AT_RISK_COMPLETION_BELOW },
      totals: { rosterSize: 0, atRiskCount: 0, averageAccuracy: 0, averageCompletionRate: 0 },
      atRiskStudents: [],
      topicMastery: [],
      topLeaderboard: [],
      studentProgressSchema: {
        collection: 'studentprogress',
        fields: {
          studentId: 'String (ref: User.studentId)',
          facultyUserId: 'String (ref: User._id)',
          subjectId: 'ObjectId (ref: Subject._id)',
          proficiencyScore: 'Number',
          completionRate: 'Number',
          averageAccuracy: 'Number',
          totalAssignedSets: 'Number',
          completedSetCount: 'Number',
          isAtRisk: 'Boolean',
        },
      },
    });
    return;
  }

  const [accuracyRows, assignmentRows, sessionRows, userRows] = await Promise.all([
    DrillSessionModel.aggregate<{ studentId: string; averageAccuracy: number; sessionsTaken: number }>([
      { $match: { studentId: { $in: rosterStudentIds } } },
      {
        $group: {
          _id: '$studentId',
          averageAccuracy: { $avg: '$accuracyPercentage' },
          sessionsTaken: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          studentId: '$_id',
          averageAccuracy: { $round: ['$averageAccuracy', 2] },
          sessionsTaken: 1,
        },
      },
    ]),
    ExamAssignmentModel.find(
      {
        studentId: { $in: rosterStudentIds },
        assignedByFacultyUserId: targetFacultyUserId,
        isActive: true,
      },
      { studentId: 1, subjectId: 1, difficulty: 1 },
    ).lean(),
    DrillSessionModel.find(
      { studentId: { $in: rosterStudentIds } },
      { studentId: 1, subjectId: 1, difficulty: 1 },
    ).lean(),
    UserModel.find(
      { role: 'STUDENT', studentId: { $in: rosterStudentIds } },
      { studentId: 1, name: 1, email: 1 },
    ).lean(),
  ]);

  const userMap = new Map(userRows.map((u) => [u.studentId, { name: u.name ?? u.studentId, email: u.email }]));
  const rosterMap = new Map(rosterRows.map((row) => [row.studentId, row]));
  const accuracyMap = new Map(accuracyRows.map((row) => [row.studentId, row]));

  const assignmentKeysByStudent = new Map<string, string[]>();
  for (const assignment of assignmentRows) {
    const subjectId = assignment.subjectId.toString();
    const key = `${subjectId}::${assignment.difficulty ?? 'ANY'}`;
    const existing = assignmentKeysByStudent.get(assignment.studentId) ?? [];
    existing.push(key);
    assignmentKeysByStudent.set(assignment.studentId, existing);
  }

  const completedExactByStudent = new Map<string, Set<string>>();
  const completedSubjectByStudent = new Map<string, Set<string>>();

  for (const session of sessionRows) {
    const studentId = session.studentId;
    const subjectId = session.subjectId.toString();
    const exactKey = `${subjectId}::${session.difficulty ?? 'ANY'}`;

    if (!completedExactByStudent.has(studentId)) completedExactByStudent.set(studentId, new Set());
    if (!completedSubjectByStudent.has(studentId)) completedSubjectByStudent.set(studentId, new Set());

    completedExactByStudent.get(studentId)?.add(exactKey);
    completedSubjectByStudent.get(studentId)?.add(subjectId);
  }

  const studentProgress = rosterStudentIds.map((studentId) => {
    const assignmentKeys = assignmentKeysByStudent.get(studentId) ?? [];
    const totalAssignedSets = assignmentKeys.length;
    const exactCompleted = completedExactByStudent.get(studentId) ?? new Set<string>();
    const subjectCompleted = completedSubjectByStudent.get(studentId) ?? new Set<string>();

    const completedSetCount = assignmentKeys.reduce((count, key) => {
      const [subjectId, diff] = key.split('::');
      if (diff === 'ANY') {
        return subjectCompleted.has(subjectId) ? count + 1 : count;
      }
      return exactCompleted.has(key) ? count + 1 : count;
    }, 0);

    const completionRate = totalAssignedSets > 0 ? Number(((completedSetCount / totalAssignedSets) * 100).toFixed(2)) : 0;
    const averageAccuracy = Number(accuracyMap.get(studentId)?.averageAccuracy ?? 0);
    const proficiencyScore = Number((averageAccuracy * 0.7 + completionRate * 0.3).toFixed(2));
    const isAtRisk = averageAccuracy < AT_RISK_ACCURACY_BELOW;

    return {
      studentId,
      studentName: userMap.get(studentId)?.name ?? studentId,
      email: userMap.get(studentId)?.email ?? '',
      section: rosterMap.get(studentId)?.section ?? null,
      department: rosterMap.get(studentId)?.department ?? null,
      averageAccuracy,
      completionRate,
      proficiencyScore,
      totalAssignedSets,
      completedSetCount,
      sessionsTaken: Number(accuracyMap.get(studentId)?.sessionsTaken ?? 0),
      isAtRisk,
    };
  });

  const weakestSubjectByStudent = await DrillSessionModel.aggregate<{
    studentId: string;
    subjectId: string;
    averageScore: number;
  }>([
    { $match: { studentId: { $in: rosterStudentIds } } },
    {
      $group: {
        _id: { studentId: '$studentId', subjectId: '$subjectId' },
        averageScore: { $avg: '$accuracyPercentage' },
      },
    },
    {
      $project: {
        _id: 0,
        studentId: '$_id.studentId',
        subjectId: { $toString: '$_id.subjectId' },
        averageScore: { $round: ['$averageScore', 2] },
      },
    },
    { $sort: { studentId: 1, averageScore: 1 } },
  ]);

  const weakestByStudentMap = new Map<string, { subjectId: string; averageScore: number }>();
  for (const row of weakestSubjectByStudent) {
    if (!weakestByStudentMap.has(row.studentId)) {
      weakestByStudentMap.set(row.studentId, { subjectId: row.subjectId, averageScore: row.averageScore });
    }
  }

  const subjectIds = [...new Set(weakestSubjectByStudent.map((row) => row.subjectId))]
    .filter((id) => isValidObjectId(id))
    .map((id) => new Types.ObjectId(id));

  const subjects = subjectIds.length
    ? await SubjectModel.find({ _id: { $in: subjectIds } }, { _id: 1, code: 1, name: 1 }).lean()
    : [];

  const subjectMap = new Map(subjects.map((s) => [s._id.toString(), `${s.code} - ${s.name}`]));

  const atRiskStudents = studentProgress
    .filter((row) => row.isAtRisk)
    .map((row) => {
      const weak = weakestByStudentMap.get(row.studentId);
      return {
        studentId: row.studentId,
        studentName: row.studentName,
        email: row.email,
        section: row.section,
        department: row.department,
        averageAccuracy: row.averageAccuracy,
        completionRate: row.completionRate,
        proficiencyScore: row.proficiencyScore,
        subjectWeakness: weak ? subjectMap.get(weak.subjectId) ?? 'Unclassified Topic' : 'No drill data yet',
        riskReason: 'Low accuracy',
      };
    })
    .sort((a, b) => a.proficiencyScore - b.proficiencyScore);

  const topicMasteryRows = await DrillResponseModel.aggregate<{
    topic: string;
    subjectId: string;
    attempts: number;
    correct: number;
    mastery: number;
  }>([
    { $match: { studentId: { $in: rosterStudentIds } } },
    {
      $lookup: {
        from: 'questions',
        localField: 'questionId',
        foreignField: '_id',
        as: 'question',
      },
    },
    { $unwind: '$question' },
    {
      $group: {
        _id: { topic: '$question.topic', subjectId: '$question.subjectId' },
        attempts: { $sum: 1 },
        correct: { $sum: { $cond: ['$isCorrect', 1, 0] } },
      },
    },
    {
      $project: {
        _id: 0,
        topic: '$_id.topic',
        subjectId: { $toString: '$_id.subjectId' },
        attempts: 1,
        correct: 1,
        mastery: {
          $round: [
            {
              $multiply: [
                {
                  $cond: [{ $eq: ['$attempts', 0] }, 0, { $divide: ['$correct', '$attempts'] }],
                },
                100,
              ],
            },
            2,
          ],
        },
      },
    },
    { $sort: { mastery: 1, attempts: -1 } },
    { $limit: 12 },
  ]);

  const topicMastery = topicMasteryRows.map((row) => ({
    topic: row.topic,
    subjectLabel: subjectMap.get(row.subjectId) ?? row.subjectId,
    attempts: row.attempts,
    mastery: row.mastery,
    struggleLevel: Number((100 - row.mastery).toFixed(2)),
  }));

  const topLeaderboard = [...studentProgress]
    .sort((a, b) => b.proficiencyScore - a.proficiencyScore)
    .slice(0, 10)
    .map((row, idx) => ({
      rank: idx + 1,
      studentId: row.studentId,
      studentName: row.studentName,
      proficiencyScore: row.proficiencyScore,
      averageAccuracy: row.averageAccuracy,
      completionRate: row.completionRate,
      sessionsTaken: row.sessionsTaken,
    }));

  const averageAccuracy =
    studentProgress.length > 0
      ? Number(
          (
            studentProgress.reduce((sum, row) => sum + row.averageAccuracy, 0) /
            studentProgress.length
          ).toFixed(2),
        )
      : 0;

  const averageCompletionRate =
    studentProgress.length > 0
      ? Number(
          (
            studentProgress.reduce((sum, row) => sum + row.completionRate, 0) /
            studentProgress.length
          ).toFixed(2),
        )
      : 0;

  res.json({
    generatedAt: new Date().toISOString(),
    thresholds: { atRiskAccuracyBelow: AT_RISK_ACCURACY_BELOW, atRiskCompletionBelow: AT_RISK_COMPLETION_BELOW },
    totals: {
      rosterSize: studentProgress.length,
      atRiskCount: atRiskStudents.length,
      averageAccuracy,
      averageCompletionRate,
    },
    atRiskStudents,
    topicMastery,
    topLeaderboard,
    studentProgressSchema: {
      collection: 'studentprogress',
      fields: {
        studentId: 'String (ref: User.studentId)',
        facultyUserId: 'String (ref: User._id)',
        subjectId: 'ObjectId (ref: Subject._id)',
        proficiencyScore: 'Number',
        completionRate: 'Number',
        averageAccuracy: 'Number',
        totalAssignedSets: 'Number',
        completedSetCount: 'Number',
        isAtRisk: 'Boolean',
      },
    },
  });
}

export async function leaderboard(req: Request, res: Response): Promise<void> {
  const role = req.user?.role;
  const fallbackScope: LeaderboardScope =
    role === 'ADMIN' ? 'GLOBAL' : role === 'STUDENT' ? 'SECTION' : 'FACULTY';
  const requestedScope = normalizeScope(req.query.scope as string | undefined, fallbackScope);
  const requestedSection = (req.query.section as string | undefined)?.trim();
  const requestedDepartment = (req.query.department as string | undefined)?.trim();
  const filterSubjectId = (req.query.subjectId as string | undefined)?.trim();
  const filterDifficulty = (req.query.difficulty as string | undefined)?.trim();
  const filterDateFrom = (req.query.dateFrom as string | undefined)?.trim();
  const filterDateTo = (req.query.dateTo as string | undefined)?.trim();

  let studentIdFilter: string[] | null = null;
  let effectiveScope: LeaderboardScope = requestedScope;

  if (role === 'FACULTY') {
    const facultyUserId = req.user?.userId ?? '';
    const scopeQuery: Record<string, unknown> = { enrolledByFacultyUserId: facultyUserId };

    if (requestedScope === 'SECTION') {
      if (requestedSection) {
        scopeQuery.section = requestedSection;
      } else {
        effectiveScope = 'FACULTY';
      }
    }

    if (requestedScope === 'DEPARTMENT') {
      if (requestedDepartment) {
        scopeQuery.department = requestedDepartment;
      } else {
        effectiveScope = 'FACULTY';
      }
    }

    if (requestedScope !== 'GLOBAL') {
      const scoped = await AllowedStudentModel.find(scopeQuery, { studentId: 1 }).lean();
      studentIdFilter = scoped.map((s) => s.studentId);
    }
  }

  if (role === 'STUDENT') {
    const myStudentId = req.user?.studentId;
    if (!myStudentId) {
      throw new ApiError(403, 'Student account required');
    }

    const myAllowed = await AllowedStudentModel.findOne({ studentId: myStudentId }).lean();
    if (!myAllowed) {
      studentIdFilter = [];
    } else if (requestedScope === 'GLOBAL') {
      studentIdFilter = null;
    } else if (requestedScope === 'DEPARTMENT') {
      if (myAllowed.department) {
        const scoped = await AllowedStudentModel.find({ department: myAllowed.department }, { studentId: 1 }).lean();
        studentIdFilter = scoped.map((s) => s.studentId);
      } else {
        effectiveScope = 'FACULTY';
      }
    } else if (requestedScope === 'SECTION') {
      if (myAllowed.section) {
        const scoped = await AllowedStudentModel.find({ section: myAllowed.section }, { studentId: 1 }).lean();
        studentIdFilter = scoped.map((s) => s.studentId);
      } else {
        effectiveScope = 'FACULTY';
      }
    }

    if (effectiveScope === 'FACULTY') {
      if (myAllowed?.enrolledByFacultyUserId) {
        const scoped = await AllowedStudentModel.find(
          { enrolledByFacultyUserId: myAllowed.enrolledByFacultyUserId },
          { studentId: 1 },
        ).lean();
        studentIdFilter = scoped.map((s) => s.studentId);
      } else {
        studentIdFilter = [myStudentId];
      }
    }
  }

  if (role === 'ADMIN') {
    if (requestedScope === 'SECTION' && requestedSection) {
      const scoped = await AllowedStudentModel.find({ section: requestedSection }, { studentId: 1 }).lean();
      studentIdFilter = scoped.map((s) => s.studentId);
    }
    if (requestedScope === 'DEPARTMENT' && requestedDepartment) {
      const scoped = await AllowedStudentModel.find({ department: requestedDepartment }, { studentId: 1 }).lean();
      studentIdFilter = scoped.map((s) => s.studentId);
    }
  }

  const hasScopedStudentFilter = Boolean(studentIdFilter);
  const hasSessionFilters = Boolean(filterSubjectId || filterDifficulty || filterDateFrom || filterDateTo);

  const eligibilityMatchConditions: Record<string, unknown> = {};
  if (studentIdFilter) eligibilityMatchConditions.studentId = { $in: studentIdFilter };
  if (filterSubjectId && isValidObjectId(filterSubjectId)) {
    eligibilityMatchConditions.subjectId = new Types.ObjectId(filterSubjectId);
  }
  if (filterDifficulty && ['Easy', 'Average', 'Difficult'].includes(filterDifficulty)) {
    eligibilityMatchConditions.difficulty = filterDifficulty;
  }
  if (filterDateFrom || filterDateTo) {
    const parsedDateFrom = parseFilterDate(filterDateFrom);
    const parsedDateTo = parseFilterDate(filterDateTo);

    if (filterDateFrom && !parsedDateFrom) {
      throw new ApiError(400, 'Invalid dateFrom format. Use yyyy-mm-dd or dd,mm,yy.');
    }
    if (filterDateTo && !parsedDateTo) {
      throw new ApiError(400, 'Invalid dateTo format. Use yyyy-mm-dd or dd,mm,yy.');
    }

    const takenAtFilter: Record<string, Date> = {};
    if (parsedDateFrom) takenAtFilter.$gte = parsedDateFrom;
    if (parsedDateTo) {
      const d = new Date(parsedDateTo);
      d.setHours(23, 59, 59, 999);
      takenAtFilter.$lte = d;
    }
    if (Object.keys(takenAtFilter).length) {
      eligibilityMatchConditions.takenAt = takenAtFilter;
    }
  }

  let eligibleStudentIds: string[] | null = null;
  if (hasSessionFilters) {
    const studentRows = await DrillSessionModel.aggregate<{ studentId: string }>([
      ...(Object.keys(eligibilityMatchConditions).length ? [{ $match: eligibilityMatchConditions }] : []),
      { $group: { _id: '$studentId' } },
      { $project: { _id: 0, studentId: '$_id' } },
    ]);
    eligibleStudentIds = studentRows.map((row) => row.studentId);
  }

  const averageMatchConditions: Record<string, unknown> = {};
  if (hasSessionFilters) {
    averageMatchConditions.studentId = { $in: eligibleStudentIds ?? [] };
  } else if (hasScopedStudentFilter) {
    averageMatchConditions.studentId = { $in: studentIdFilter ?? [] };
  }

  const averageMatchStage = Object.keys(averageMatchConditions).length
    ? [{ $match: averageMatchConditions }]
    : [];

  const rows = await DrillSessionModel.aggregate<{
    studentId: string;
    avgAccuracy: number;
    sessionsTaken: number;
  }>([
    ...averageMatchStage,
    {
      $group: {
        _id: '$studentId',
        avgAccuracy: { $avg: '$accuracyPercentage' },
        sessionsTaken: { $sum: 1 },
      },
    },
    { $sort: { avgAccuracy: -1 } },
    ...(role === 'ADMIN' || role === 'FACULTY' ? [{ $limit: 10 }] : []),
    {
      $project: {
        _id: 0,
        studentId: '$_id',
        avgAccuracy: { $round: ['$avgAccuracy', 2] },
        sessionsTaken: 1,
      },
    },
  ]);

  const users = await UserModel.find(
    { role: 'STUDENT', studentId: { $in: rows.map((r) => r.studentId) } },
    { name: 1, studentId: 1 },
  ).lean();

  const nameMap = new Map(users.map((u) => [u.studentId, u.name ?? u.studentId]));
  const isStaff = req.user!.role !== 'STUDENT';

  const ranked = rows.map((r, i) => ({
    rank: i + 1,
    name: nameMap.get(r.studentId) ?? r.studentId,
    ...(isStaff ? { studentId: r.studentId } : {}),
    avgAccuracy: r.avgAccuracy,
    sessionsTaken: r.sessionsTaken,
  }));

  res.json({
    scope: effectiveScope,
    totalStudents: ranked.length,
    items: ranked,
  });
}
