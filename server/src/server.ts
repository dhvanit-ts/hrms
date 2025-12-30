import 'dotenv/config';
import { createServer } from 'node:http';
import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { logger } from './config/logger.js';
import SocketService from './infra/services/sockets/socket.service.js';

async function start() {
  const env = loadEnv();
  const app = createApp();
  const server = createServer(app);

  SocketService.setup(server)

  server.listen(env.PORT, () => {
    logger.info(`Server listening on http://localhost:${env.PORT}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


