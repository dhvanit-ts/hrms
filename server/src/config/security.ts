import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import type { Express } from 'express';
import { loadEnv } from './env.js';

export const applySecurity = (app: Express) => {
  const env = loadEnv();
  app.disable('x-powered-by');
  app.use(helmet());
  const origins = env.CORS_ORIGINS.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: origins,
      credentials: true
    })
  );

  const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: 'Too many requests, please try again later.'
  });

  app.use('/api/auth', authLimiter);
};


