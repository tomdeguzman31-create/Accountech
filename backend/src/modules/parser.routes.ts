import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';
import { parseQuestionBankFile } from './parser.service.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post(
  '/question-bank',
  requireAuth,
  requireRoles(['ADMIN', 'FACULTY']),
  upload.single('file'),
  asyncHandler(parseQuestionBankFile),
);

export default router;
