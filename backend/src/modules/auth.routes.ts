import { Router } from 'express';
import { asyncHandler } from '../utils/http.js';
import {
  activateStudentAccount,
  changePassword,
  createStaffAccount,
  login,
  me,
  requestPasswordResetOtp,
  requestStudentOtp,
  resetPasswordWithOtp,
  verifyOtp,
  updateProfile,
} from './auth.service.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();

router.post('/request-otp', asyncHandler(requestStudentOtp));
router.post('/verify-otp', asyncHandler(verifyOtp));
router.post('/activate', asyncHandler(activateStudentAccount));
router.post('/request-reset-otp', asyncHandler(requestPasswordResetOtp));
router.post('/reset-password', asyncHandler(resetPasswordWithOtp));
router.post('/login', asyncHandler(login));
router.get('/me', requireAuth, asyncHandler(me));
router.put('/me/profile', requireAuth, asyncHandler(updateProfile));
router.put('/me/password', requireAuth, asyncHandler(changePassword));
router.post('/staff', requireAuth, requireRoles(['ADMIN']), asyncHandler(createStaffAccount));

export default router;
