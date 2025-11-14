import winston from 'winston';

const isDev = (process.env.NODE_ENV ?? 'development') !== 'production';

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

// Sentry placeholder: integrate @sentry/node and transport here if DSN present.


