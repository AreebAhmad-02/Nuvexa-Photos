/** Photos service: stores users' photos in Cloudinary and their metadata in MongoDB. */
import cors from 'cors';
import express from 'express';
import multer from 'multer';

import { createPhotosRouter } from './controller/photosController.js';

/**
 * Build the Express app with its dependencies.
 * @param {object} deps see createPhotosRouter
 */
export function createApp(deps) {
  const app = express();
  app.use(cors());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use('/api/photo', createPhotosRouter(deps));

  // Turn upload errors (e.g. a file over 10 MB) into clear JSON responses.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(status).json({ status: false, msg: err.message });
    }
    console.error(err);
    return res.status(500).json({ status: false, msg: 'Internal Server Error' });
  });

  return app;
}
