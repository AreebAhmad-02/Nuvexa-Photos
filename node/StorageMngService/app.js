/** Storage service: keeps each user's storage total, in bytes. */
import cors from 'cors';
import express from 'express';

import { createStorageController } from './controller/storageController.js';
import { createStorageRouter } from './routes/storageRoute.js';

/**
 * Build the Express app with its dependencies.
 * @param {object} deps see createStorageController
 */
export function createApp(deps) {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/storage', createStorageRouter(createStorageController(deps)));
  app.get('/', (req, res) => res.send('Storage service is running'));
  return app;
}
