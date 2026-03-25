import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';
import { createDrillSession, listAssignedDrillContent, submitDrillSession } from './drills.service.js';

const router = Router();

router.get('/assigned-content', requireAuth, requireRoles(['STUDENT']), asyncHandler(listAssignedDrillContent));
router.post('/session', requireAuth, requireRoles(['STUDENT']), asyncHandler(createDrillSession));
router.post('/submit', requireAuth, requireRoles(['STUDENT']), asyncHandler(submitDrillSession));

export default router;
