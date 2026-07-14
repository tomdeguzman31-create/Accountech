import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';
import {
	deanOverview,
	facultyInstructionalReport,
	facultyRosterReadiness,
	leaderboard,
	myProgress,
	studentHistory,
} from './analytics.service.js';

const router = Router();

router.get('/me', requireAuth, requireRoles(['STUDENT']), asyncHandler(myProgress));
router.get('/overview', requireAuth, requireRoles(['ADMIN', 'FACULTY']), asyncHandler(deanOverview));
router.get('/faculty-readiness', requireAuth, requireRoles(['ADMIN']), asyncHandler(facultyRosterReadiness));
router.get('/faculty-instructional-report', requireAuth, requireRoles(['FACULTY', 'ADMIN']), asyncHandler(facultyInstructionalReport));
router.get('/leaderboard', requireAuth, asyncHandler(leaderboard));
router.get('/student/:studentId', requireAuth, requireRoles(['FACULTY', 'ADMIN']), asyncHandler(studentHistory));


export default router;
