/** Usage service: keeps each user's usage total, in bytes. */
import cors from 'cors';
import express from 'express';

import { createUsageController } from './controller/usageController.js';
import { createUsageRouter } from './routes/usageRoute.js';

/**
 * Build the Express app with its dependencies.
 * @param {object} deps see createUsageController
 */
export function createApp(deps) {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/usage', createUsageRouter(createUsageController(deps)));
  app.get('/', (req, res) => res.send('Usage service is running'));
  return app;
}
