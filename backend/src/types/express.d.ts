import type { AuthClaims } from './auth.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthClaims;
    }
  }
}

export {};
