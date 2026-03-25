import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  mongoUri: requireEnv('MONGO_URI', 'mongodb://127.0.0.1:27017/accountech_db'),
  jwtSecret: requireEnv('JWT_SECRET', 'change_this_secret_before_prod'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  allowedEmailDomain: process.env.ALLOWED_EMAIL_DOMAIN ?? 'phinmaed.com',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 12),
  sendgridApiKey: process.env.SENDGRID_API_KEY ?? '',
  sendgridFromEmail: process.env.SENDGRID_FROM_EMAIL ?? process.env.FROM_EMAIL ?? '',
  sendgridFromName: process.env.SENDGRID_FROM_NAME ?? 'AccounTech',
};
