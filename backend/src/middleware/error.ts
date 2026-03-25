import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/http.js';

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ message: 'Route not found' });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({ message: err.message, details: err.details ?? null });
    return;
  }

  const message = err instanceof Error ? err.message : 'Internal server error';

  if (message === 'Unauthorized' || message === 'Invalid token') {
    res.status(401).json({ message });
    return;
  }

  res.status(500).json({ message });
}
