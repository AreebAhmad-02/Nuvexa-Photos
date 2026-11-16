/** Routes of the Storage service, mounted at /api/storage. */
import { Router } from 'express';

/** @param {object} controller handlers from createStorageController */
export function createStorageRouter(controller) {
  const router = Router();
  router.get('/user/:userId', controller.getByUser);
  router.put('/user/:userId', controller.updateByUser);
  router.post('/', controller.create);
  return router;
}
