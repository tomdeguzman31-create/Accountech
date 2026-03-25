import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { AuthClaims } from '../types/auth.js';

export async function hashValue(value: string): Promise<string> {
  return bcrypt.hash(value, env.bcryptRounds);
}

export async function compareHash(value: string, hash: string): Promise<boolean> {
  return bcrypt.compare(value, hash);
}

export function generateOtp(length = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = crypto.randomBytes(length);
  let otp = '';

  for (let i = 0; i < length; i += 1) {
    otp += chars[bytes[i] % chars.length];
  }

  return otp;
}

export function signToken(claims: AuthClaims): string {
  return jwt.sign(claims, env.jwtSecret, { expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] });
}
