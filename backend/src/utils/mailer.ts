import sgMail from '@sendgrid/mail';
import { env } from '../config/env.js';

export type OtpPurpose = 'verification' | 'password-reset' | 'login';

function isSendGridConfigured(): boolean {
  return Boolean(env.sendgridApiKey && env.sendgridFromEmail);
}

export function getSendGridConfigError(): string | null {
  if (!env.sendgridApiKey) {
    return 'SENDGRID_API_KEY is missing.';
  }

  if (!env.sendgridFromEmail) {
    return 'SENDGRID_FROM_EMAIL is missing.';
  }

  const normalizedKey = env.sendgridApiKey.trim().toLowerCase();
  if (
    normalizedKey === 'your_sendgrid_api_key'
    || normalizedKey === 'paste_sendgrid_api_key_here'
  ) {
    return 'SENDGRID_API_KEY is still a placeholder. Use a real SendGrid API key.';
  }

  if (
    env.sendgridFromEmail.trim().toLowerCase() === 'verified_sender@yourdomain.com'
    || env.sendgridFromEmail.trim().toLowerCase() === 'your_verified_sender@example.com'
  ) {
    return 'SENDGRID_FROM_EMAIL is still a placeholder. Use a verified sender email.';
  }

  return null;
}

function getMailCopy(purpose: OtpPurpose, otp: string): { subject: string; text: string; html: string } {
  const subject = purpose === 'verification'
    ? 'Account Verification OTP'
    : purpose === 'password-reset'
      ? 'Password Reset OTP'
      : 'Login OTP';

  const action = purpose === 'verification'
    ? 'verify your account'
    : purpose === 'password-reset'
      ? 'reset your password'
      : 'complete your login';

  return {
    subject,
    text: `Your OTP code is ${otp}. Use this code to ${action}. It will expire in 15 minutes.`,
    html: `<p>Your OTP code is <strong>${otp}</strong>.</p><p>Use this code to ${action}. It will expire in <strong>15 minutes</strong>.</p>`,
  };
}

export async function sendOtpEmail(to: string, otp: string, purpose: OtpPurpose): Promise<boolean> {
  const { subject, text, html } = getMailCopy(purpose, otp);

  const sendGridConfigError = getSendGridConfigError();
  if (sendGridConfigError || !isSendGridConfigured()) {
    // eslint-disable-next-line no-console
    console.error('SendGrid config error:', sendGridConfigError ?? 'Missing SendGrid settings');
    return false;
  }

  sgMail.setApiKey(env.sendgridApiKey);

  try {
    await sgMail.send({
      to,
      from: {
        email: env.sendgridFromEmail,
        name: env.sendgridFromName,
      },
      subject,
      text,
      html,
    });

    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('SendGrid send failed:', error);
    return false;
  }
}
