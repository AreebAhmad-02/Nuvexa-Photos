/** Routes of the User service, mounted at /api/user. */
import { Router } from 'express';

/**
 * @param {{ register: Function, login: Function }} controller handlers from createUserController
 */
export function createUserRouter(controller) {
  const router = Router();
  router.post('/register', controller.register);
  router.post('/login', controller.login);
  return router;
}
