import 'dotenv/config.js';
import { createServer } from 'node:http';
import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { logger } from './config/logger.js';
import SSE from './infra/services/SSE/index.js';

async function start() {
  const env = loadEnv();
  const app = createApp();
  const server = createServer(app);

  // Start periodic cleanup for SSE connections
  setInterval(() => {
    SSE.cleanup();
  }, 60000); // Cleanup every minute

  server.listen(env.PORT, () => {
    logger.info(`Server listening on http://localhost:${env.PORT}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    SSE.close();
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    SSE.close();
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


