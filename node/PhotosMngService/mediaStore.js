/** Wrapper around Cloudinary, where the image files themselves are stored. */
import { v2 as cloudinary } from 'cloudinary';

const UPLOAD_FOLDER = 'RAAFZ';

/**
 * @param {{ cloudName: string, apiKey: string, apiSecret: string }} credentials
 */
export function createMediaStore({ cloudName, apiKey, apiSecret }) {
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

  return {
    /** Upload an in-memory file; returns { url, publicId }. */
    async upload(file) {
      const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      const result = await cloudinary.uploader.upload(dataUri, { folder: UPLOAD_FOLDER });
      return { url: result.url, publicId: result.public_id };
    },

    /** Delete a previously uploaded file. */
    async remove(publicId) {
      await cloudinary.uploader.destroy(publicId);
    },
  };
}
