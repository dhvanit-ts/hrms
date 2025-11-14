import type { ErrorRequestHandler } from 'express';
import { logger } from '../config/logger.js';

const isDev = (process.env.NODE_ENV ?? 'development') !== 'production';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  logger.error('Unhandled error', {
    path: req.path,
    method: req.method,
    message: err.message,
    stack: err.stack
  });
  const status = typeof err.status === 'number' ? err.status : 500;
  const body: Record<string, unknown> = {
    title: 'InternalServerError',
    status,
    detail: status === 500 ? 'An unexpected error occurred' : err.message
  };
  if (isDev) {
    body.stack = err.stack;
  }
  res.status(status).json(body);
};


