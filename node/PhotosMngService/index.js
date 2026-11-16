/** Entry point: reads configuration, connects to MongoDB and starts the Photos service. */
import 'dotenv/config';

import mongoose from 'mongoose';

import { createApp } from './app.js';
import { createLogger } from './logClient.js';
import { createMediaStore } from './mediaStore.js';
import Photos from './models/photos.js';
import { createQuotaClient } from './quotaClient.js';

const env = process.env;
const REQUIRED = [
  'MONGO_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];
const missing = REQUIRED.filter((name) => !env[name]);
if (missing.length) {
  console.error(`Missing settings: ${missing.join(', ')}. See .env.example.`);
  process.exit(1);
}

const PORT = Number(env.PORT ?? 8001);

await mongoose.connect(env.MONGO_URL);
console.log('Connected to MongoDB');

const app = createApp({
  Photos,
  storage: createQuotaClient(env.STORAGE_SERVICE_URL, 'storage', 'totalStorage'),
  usage: createQuotaClient(env.USAGE_SERVICE_URL, 'usage', 'totalUsage'),
  media: createMediaStore({
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
  }),
  limits: {
    storage: Number(env.STORAGE_LIMIT ?? 10 * 1024 * 1024), // 10 MB
    dailyUsage: Number(env.DAILY_USAGE_LIMIT ?? 25 * 1024 * 1024), // 25 MB
  },
  log: createLogger(env.LOGGING_SERVICE_URL ?? 'http://loggingservice-srv:8004/log'),
});

app.listen(PORT, () => {
  console.log(`Photos service running on port ${PORT}`);
});
