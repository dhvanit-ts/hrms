import 'dotenv/config';
import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { logger } from './config/logger.js';

async function start() {
  const env = loadEnv();
  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info(`Server listening on http://localhost:${env.PORT}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


