import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';
import { createQuestion, createQuestionsBulk, listQuestions } from './questions.service.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(listQuestions));
router.post('/', requireAuth, requireRoles(['ADMIN', 'FACULTY']), asyncHandler(createQuestion));
router.post('/bulk', requireAuth, requireRoles(['ADMIN', 'FACULTY']), asyncHandler(createQuestionsBulk));

export default router;
