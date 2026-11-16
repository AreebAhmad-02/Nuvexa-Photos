/** User service: registers users and checks their login details. */
import cors from 'cors';
import express from 'express';

import { createUserController } from './controller/userController.js';
import { createUserRouter } from './routes/userRoute.js';

/**
 * Build the Express app with its dependencies.
 * @param {object} deps see createUserController
 */
export function createApp(deps) {
  const app = express();
  app.use(cors());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use('/api/user', createUserRouter(createUserController(deps)));
  return app;
}
