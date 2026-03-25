import type { Request, Response } from 'express';
import { AllowedStudentModel } from '../models/allowedStudent.model.js';
import { UserModel } from '../models/user.model.js';
import { env } from '../config/env.js';
import { compareHash, generateOtp, hashValue, signToken } from '../utils/auth.js';
import { ApiError } from '../utils/http.js';
import type { UserRole } from '../types/auth.js';
import { getSendGridConfigError, sendOtpEmail, type OtpPurpose } from '../utils/mailer.js';

function assertAllowedEmailDomain(email: string): void {
  if (!email.endsWith(`@${env.allowedEmailDomain}`)) {
    throw new ApiError(403, `Only ${env.allowedEmailDomain} emails are allowed`);
  }
}

function sanitizeUser(user: {
  _id: { toString(): string };
  email: string;
  role: UserRole;
  name?: string | null;
  studentId?: string | null;
}) {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name ?? null,
    studentId: user.studentId ?? null,
  };
}

async function resolveStudentIdForEmail(email: string): Promise<string | null> {
  const normalizedEmail = email.toLowerCase().trim();

  const allowed = await AllowedStudentModel.findOne({ phinmaEmail: normalizedEmail }).lean();
  if (!allowed) {
    throw new ApiError(403, 'Email is not in allowed registration list');
  }

  const wasEnrolledByFaculty = Boolean(allowed.enrolledByFacultyUserId || allowed.enrolledByFacultyEmail);
  if (!wasEnrolledByFaculty) {
    throw new ApiError(403, 'Email is not yet enrolled by faculty. Please contact your faculty for whitelist enrollment first.');
  }

  return allowed.studentId;
}

function isOtpValid(
  user: { otpHash?: string | null; otpExpiresAt?: Date | null; otpPurpose?: OtpPurpose | null },
  otp: string,
  purpose?: OtpPurpose,
): boolean {
  if (!user.otpHash || !user.otpExpiresAt) {
    return false;
  }

  if (purpose && user.otpPurpose !== purpose) {
    return false;
  }

  if (user.otpExpiresAt.getTime() < Date.now()) {
    return false;
  }

  return user.otpHash === otp;
}

export async function requestStudentOtp(req: Request, res: Response): Promise<void> {
  const { email, termsAccepted } = req.body as { email?: string; termsAccepted?: boolean };

  if (!email) {
    throw new ApiError(400, 'Email is required');
  }

  if (termsAccepted !== true) {
    throw new ApiError(400, 'You must accept the Terms of Service before email verification.');
  }

  assertAllowedEmailDomain(email);

  const normalizedEmail = email.toLowerCase().trim();
  const allowedStudent = await AllowedStudentModel.findOne({ phinmaEmail: normalizedEmail }).lean();
  const existingUser = await UserModel.findOne({ email: normalizedEmail }).lean();

  if (allowedStudent?.isRegistered || existingUser?.isActivated) {
    throw new ApiError(409, 'Account already verified. Please sign in.');
  }

  const studentId = await resolveStudentIdForEmail(normalizedEmail);

  const otp = generateOtp();
  const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await UserModel.findOneAndUpdate(
    { email: normalizedEmail },
    {
      $set: {
        email: normalizedEmail,
        role: 'STUDENT',
        studentId,
        otpHash: otp,
        otpExpiresAt,
        otpPurpose: 'verification',
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const sentByEmail = await sendOtpEmail(normalizedEmail, otp, 'verification');

  if (!sentByEmail) {
    const sendGridIssue = getSendGridConfigError();
    throw new ApiError(502, sendGridIssue ? `Unable to send OTP email. ${sendGridIssue}` : 'Unable to send OTP email. Please check your SendGrid configuration.');
  }

  res.json({ message: 'Email verified. OTP has been sent.', delivery: 'email' });
}

export async function activateStudentAccount(req: Request, res: Response): Promise<void> {
  const { email, password, name, otp } = req.body as {
    email?: string;
    password?: string;
    name?: string;
    otp?: string;
  };

  if (!email || !password || !name || !otp) {
    throw new ApiError(400, 'email, password, name, and otp are required');
  }

  const normalizedEmail = email.toLowerCase().trim();
  assertAllowedEmailDomain(normalizedEmail);

  const existingUser = await UserModel.findOne({ email: normalizedEmail });
  if (!existingUser || !isOtpValid(existingUser, otp, 'verification')) {
    throw new ApiError(401, 'Invalid or expired OTP');
  }

  const studentId = await resolveStudentIdForEmail(normalizedEmail);

  const user = await UserModel.findOneAndUpdate(
    { email: normalizedEmail },
    {
      $set: {
        email: normalizedEmail,
        passwordHash: await hashValue(password),
        role: 'STUDENT',
        name: name.trim(),
        studentId,
        isActivated: true,
        isActive: true,
        otpHash: null,
        otpExpiresAt: null,
        otpPurpose: null,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  if (user.studentId) {
    await AllowedStudentModel.updateOne({ studentId: user.studentId }, { $set: { isRegistered: true } });
  }

  res.json({ message: 'Account activated successfully' });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  assertAllowedEmailDomain(email);

  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  if (!user.passwordHash || !user.isActivated || !user.isActive) {
    throw new ApiError(401, 'Account is not activated yet');
  }

  const isValid = await compareHash(password, user.passwordHash);
  if (!isValid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  // Backfill legacy student accounts that were activated without studentId.
  if (user.role === 'STUDENT' && !user.studentId) {
    const resolvedStudentId = await resolveStudentIdForEmail(user.email);
    user.studentId = resolvedStudentId;
  }

  user.lastLogin = new Date();
  await user.save();

  const token = signToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    studentId: user.studentId ?? null,
  });

  res.json({ token, user: sanitizeUser(user) });
}

export async function verifyLoginOtp(req: Request, res: Response): Promise<void> {
  const { email, otp } = req.body as { email?: string; otp?: string };

  if (!email || !otp) {
    throw new ApiError(400, 'email and otp are required');
  }

  const normalizedEmail = email.toLowerCase().trim();
  assertAllowedEmailDomain(normalizedEmail);

  const user = await UserModel.findOne({ email: normalizedEmail });
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  if (!user.passwordHash || !user.isActivated || !user.isActive) {
    throw new ApiError(401, 'Account is not activated yet');
  }

  if (!isOtpValid(user, otp, 'login')) {
    throw new ApiError(401, 'Invalid or expired OTP');
  }

  if (user.role === 'STUDENT' && !user.studentId) {
    const resolvedStudentId = await resolveStudentIdForEmail(user.email);
    user.studentId = resolvedStudentId;
  }

  user.otpHash = null;
  user.otpExpiresAt = null;
  user.otpPurpose = null;
  user.lastLogin = new Date();
  await user.save();

  const token = signToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    studentId: user.studentId ?? null,
  });

  res.json({ token, user: sanitizeUser(user) });
}

export async function createStaffAccount(req: Request, res: Response): Promise<void> {
  const { email, password, role, name } = req.body as {
    email?: string;
    password?: string;
    role?: UserRole;
    name?: string;
  };

  if (!email || !password || !role || !name) {
    throw new ApiError(400, 'email, password, role, and name are required');
  }

  assertAllowedEmailDomain(email);

  if (!['ADMIN', 'FACULTY'].includes(role)) {
    throw new ApiError(400, 'Role must be ADMIN or FACULTY');
  }

  const hash = await hashValue(password);

  await UserModel.findOneAndUpdate(
    { email },
    {
      $set: {
        passwordHash: hash,
        role,
        name,
        isActivated: true,
        isActive: true,
      },
    },
    { upsert: true, new: true },
  );

  res.status(201).json({ message: 'Staff account created/updated' });
}

export async function requestPasswordResetOtp(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email?: string };

  if (!email) {
    throw new ApiError(400, 'Email is required');
  }

  assertAllowedEmailDomain(email);

  const normalizedEmail = email.toLowerCase().trim();
  const user = await UserModel.findOne({ email: normalizedEmail });
  if (!user) {
    throw new ApiError(404, 'Email not found in our records');
  }

  if (user.role === 'STUDENT') {
    const allowedStudent = await AllowedStudentModel.findOne({ phinmaEmail: normalizedEmail }).lean();
    const wasEnrolledByFaculty = Boolean(allowedStudent?.enrolledByFacultyUserId || allowedStudent?.enrolledByFacultyEmail);

    if (!wasEnrolledByFaculty) {
      throw new ApiError(403, 'Email is not yet enrolled by faculty. Please contact your faculty for whitelist enrollment first.');
    }
  }

  const otp = generateOtp();
  user.otpHash = otp;
  user.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  user.otpPurpose = 'password-reset';
  await user.save();

  const sentByEmail = await sendOtpEmail(normalizedEmail, otp, 'password-reset');

  if (!sentByEmail) {
    const sendGridIssue = getSendGridConfigError();
    throw new ApiError(502, sendGridIssue ? `Unable to send OTP email. ${sendGridIssue}` : 'Unable to send OTP email. Please check your SendGrid configuration.');
  }

  res.json({ message: 'Email verified. OTP has been sent.', delivery: 'email' });
}

export async function resetPasswordWithOtp(req: Request, res: Response): Promise<void> {
  const { email, password, otp } = req.body as { email?: string; password?: string; otp?: string };

  if (!email || !password || !otp) {
    throw new ApiError(400, 'email, password, and otp are required');
  }

  const normalizedEmail = email.toLowerCase().trim();
  assertAllowedEmailDomain(normalizedEmail);

  const user = await UserModel.findOne({ email: normalizedEmail });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (!isOtpValid(user, otp, 'password-reset')) {
    throw new ApiError(401, 'Invalid or expired OTP');
  }

  user.passwordHash = await hashValue(password);
  user.otpHash = null;
  user.otpExpiresAt = null;
  user.otpPurpose = null;
  user.isActivated = true;
  await user.save();

  res.json({ message: 'Password reset successful' });
}

export async function verifyOtp(req: Request, res: Response): Promise<void> {
  const { email, otp, purpose } = req.body as { email?: string; otp?: string; purpose?: OtpPurpose };

  if (!email || !otp) {
    throw new ApiError(400, 'email and otp are required');
  }

  const normalizedEmail = email.toLowerCase().trim();
  assertAllowedEmailDomain(normalizedEmail);

  const user = await UserModel.findOne({ email: normalizedEmail });
  if (!user || !isOtpValid(user, otp, purpose)) {
    throw new ApiError(401, 'Invalid or expired OTP');
  }

  res.json({ message: 'OTP verified' });
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user?.userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const user = await UserModel.findById(req.user.userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json({ user: sanitizeUser(user) });
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  if (!req.user?.userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { name } = req.body as { name?: string };
  if (!name?.trim()) {
    throw new ApiError(400, 'name is required');
  }

  const user = await UserModel.findByIdAndUpdate(req.user.userId, { $set: { name: name.trim() } }, { new: true });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json({ user: sanitizeUser(user), message: 'Profile updated' });
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  if (!req.user?.userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'currentPassword and newPassword are required');
  }

  const user = await UserModel.findById(req.user.userId);
  if (!user || !user.passwordHash) {
    throw new ApiError(404, 'User not found');
  }

  const isValid = await compareHash(currentPassword, user.passwordHash);
  if (!isValid) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  user.passwordHash = await hashValue(newPassword);
  await user.save();

  res.json({ message: 'Password updated' });
}
