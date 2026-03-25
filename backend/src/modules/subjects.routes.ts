import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';
import { createSubject, deleteSubject, listSubjects, updateSubject } from './subjects.service.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(listSubjects));
router.post('/', requireAuth, requireRoles(['ADMIN']), asyncHandler(createSubject));
router.put('/:id', requireAuth, requireRoles(['ADMIN']), asyncHandler(updateSubject));
router.delete('/:id', requireAuth, requireRoles(['ADMIN']), asyncHandler(deleteSubject));

export default router;
