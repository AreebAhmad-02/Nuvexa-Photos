/**
 * Photos API: upload, list and delete a user's photos.
 *
 * Every upload is checked against two limits kept by other services: total storage
 * (Storage service) and bytes uploaded today (Usage service). The counters are only
 * increased after the file is safely stored, so a failed upload never uses up quota.
 * All dependencies are passed in, so the routes can be tested without real services.
 */
import { Router } from 'express';
import multer from 'multer';

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB per file

/** Format a byte count for messages, e.g. 10485760 -> "10 MB". */
export const formatMB = (bytes) => `${Math.round(bytes / (1024 * 1024))} MB`;

/**
 * @param {object} deps
 * @param {import('mongoose').Model} deps.Photos photo metadata model
 * @param {{ get: Function, set: Function }} deps.storage total-storage counter (quotaClient)
 * @param {{ get: Function, set: Function }} deps.usage daily-usage counter (quotaClient)
 * @param {{ upload: Function, remove: Function }} deps.media file store (mediaStore)
 * @param {{ storage: number, dailyUsage: number }} deps.limits limits in bytes
 * @param {(event: string, message: string) => Promise<void>} deps.log
 */
export function createPhotosRouter({ Photos, storage, usage, media, limits, log }) {
  const router = Router();
  const upload = multer({ limits: { fileSize: MAX_FILE_BYTES } }).single('image');

  /** POST /upload  multipart form: image (file), userId */
  router.post('/upload', upload, async (req, res) => {
    const { file } = req;
    const { userId } = req.body ?? {};
    if (!file) {
      await log('Image upload failed', 'No file uploaded');
      return res.status(400).json({ status: false, msg: 'No file uploaded' });
    }
    if (!userId) {
      return res.status(400).json({ status: false, msg: 'userId is required' });
    }

    let storedBytes;
    let usedToday;
    try {
      [storedBytes, usedToday] = await Promise.all([storage.get(userId), usage.get(userId)]);
    } catch (error) {
      console.error('Quota services unavailable:', error.message);
      return res.status(502).json({ status: false, msg: 'Could not check your storage limits' });
    }

    if (storedBytes + file.size > limits.storage) {
      return res.status(403).json({
        status: false,
        msg: `Limit exceeded. Total storage limit is ${formatMB(limits.storage)}`,
      });
    }
    if (usedToday + file.size > limits.dailyUsage) {
      return res.status(403).json({
        status: false,
        msg: `Limit exceeded. Daily upload limit is ${formatMB(limits.dailyUsage)}`,
      });
    }

    let photo;
    try {
      const { url, publicId } = await media.upload(file);
      photo = await Photos.create({
        photoName: file.originalname,
        photoSize: file.size,
        url,
        publicId,
        userId,
      });
    } catch (error) {
      console.error('Upload failed:', error);
      await log('Image upload failed', `Upload failed for user ID ${userId}`);
      return res.status(500).json({ status: false, msg: 'Upload failed, please try again' });
    }

    try {
      await Promise.all([
        storage.set(userId, storedBytes + file.size),
        usage.set(userId, usedToday + file.size),
      ]);
    } catch (error) {
      // The photo is saved; report the counter problem without failing the upload.
      console.error('Could not update quota counters:', error.message);
    }

    await log('Image upload successful', `Image uploaded for user ID ${userId}`);
    return res.json({ file: photo, message: 'Image uploaded successfully' });
  });

  /** GET / : every photo's metadata (admin and debugging use). */
  router.get('/', async (req, res) => {
    try {
      const photos = await Photos.find();
      return res.json(photos);
    } catch (error) {
      console.error('Error retrieving images:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  /** GET /user/:userId : one user's photos. */
  router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
      const photos = await Photos.find({ userId });
      await log('Retrieve images by user ID', `Images retrieved for user ID ${userId}`);
      return res.json(photos);
    } catch (error) {
      console.error('Error retrieving images:', error);
      await log('Retrieve images by user ID failed', `Failed for user ID ${userId}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  /** DELETE /:id : remove a photo and give its bytes back to the user's storage. */
  router.delete('/:id', async (req, res) => {
    try {
      const photo = await Photos.findById(req.params.id);
      if (!photo) {
        return res.status(404).json({ error: 'Image not found' });
      }

      await media.remove(photo.publicId);
      await Photos.findByIdAndDelete(photo._id);

      try {
        const storedBytes = await storage.get(photo.userId);
        await storage.set(photo.userId, Math.max(0, storedBytes - photo.photoSize));
      } catch (error) {
        console.error('Could not update storage after delete:', error.message);
      }

      await log('Image deletion successful', `Image deleted for user ID ${photo.userId}`);
      return res.json({ message: 'Image deleted successfully' });
    } catch (error) {
      console.error('Error deleting image:', error);
      await log('Image deletion failed', 'Internal Server Error');
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  return router;
}
