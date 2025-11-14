import express from 'express';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import { applySecurity } from './config/security.js';
import { errorHandler } from './middlewares/error.js';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import fs from 'node:fs';
import path from 'node:path';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  applySecurity(app);

  const openapiPath = path.join(process.cwd(), 'openapi.yaml');
  if (fs.existsSync(openapiPath)) {
    const spec = YAML.parse(fs.readFileSync(openapiPath, 'utf8'));
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec));
  }

  app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));
  app.get('/readyz', (_req, res) => res.json({ status: 'ready' }));
  app.use('/api', routes);
  app.use(errorHandler);
  return app;
}


