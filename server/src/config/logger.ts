import winston from 'winston';
import { loadEnv } from './env.js';

const env = loadEnv()

const isDev = (env.NODE_ENV ?? 'development') !== 'production';
const isDebug = env.NODE_ENV === "debug"

const devFormat = winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta, null, 2)}` : '';
  return `[${timestamp}] ${level}: ${stack ?? message}${metaString}`;
});

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    isDev
      ? winston.format.combine(winston.format.colorize(), devFormat)
      : winston.format.json()
  ),
  transports: [new winston.transports.Console({ stderrLevels: ['error'] })]
});

export const debug = {
  log: (...msg: any[]) => isDebug ? console.log(...msg) : null,
  warn: (...msg: any[]) => isDebug ? console.warn(...msg) : null
}

// Sentry placeholder: integrate @sentry/node and transport here if DSN present.


