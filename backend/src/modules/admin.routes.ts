import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';
import { readinessReport } from './admin.service.js';

const router = Router();

router.get('/readiness-report', requireAuth, requireRoles(['ADMIN']), asyncHandler(readinessReport));

export default router;
