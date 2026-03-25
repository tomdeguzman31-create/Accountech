import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';
import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
} from './announcements.service.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(listAnnouncements));
router.post('/', requireAuth, requireRoles(['ADMIN', 'FACULTY']), asyncHandler(createAnnouncement));
router.delete('/:id', requireAuth, requireRoles(['ADMIN', 'FACULTY']), asyncHandler(deleteAnnouncement));

export default router;
