import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';
import { assignExamContent, bulkEnrollStudents, listAllowedStudents, removeAllowedStudent } from './students.service.js';

const router = Router();

router.get('/', requireAuth, requireRoles(['ADMIN', 'FACULTY']), asyncHandler(listAllowedStudents));
router.post('/bulk', requireAuth, requireRoles(['ADMIN', 'FACULTY']), asyncHandler(bulkEnrollStudents));
router.post('/assign-content', requireAuth, requireRoles(['ADMIN', 'FACULTY']), asyncHandler(assignExamContent));
router.delete('/:studentId', requireAuth, requireRoles(['ADMIN', 'FACULTY']), asyncHandler(removeAllowedStudent));

export default router;
