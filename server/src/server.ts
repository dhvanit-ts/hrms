import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { logger } from './config/logger.js';

async function start() {
  const env = loadEnv();
  await mongoose.connect(env.MONGO_URI);
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


