/** Routes of the Usage service, mounted at /api/usage. */
import { Router } from 'express';

/** @param {object} controller handlers from createUsageController */
export function createUsageRouter(controller) {
  const router = Router();
  router.get('/user/:userId', controller.getByUser);
  router.put('/user/:userId', controller.updateByUser);
  router.post('/', controller.create);
  return router;
}
