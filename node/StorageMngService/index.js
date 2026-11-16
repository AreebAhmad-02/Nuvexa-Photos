/** Entry point: connects to MongoDB and starts the Storage service. */
import 'dotenv/config';

import mongoose from 'mongoose';

import { createApp } from './app.js';
import { createLogger } from './logClient.js';
import { addNewStorage, getStorageByUserId, updateStorageByUserId } from './model/storage.js';

const PORT = Number(process.env.PORT ?? 8002);
const { MONGO_URL } = process.env;
const LOGGING_SERVICE_URL = process.env.LOGGING_SERVICE_URL ?? 'http://loggingservice-srv:8004/log';

if (!MONGO_URL) {
  console.error('MONGO_URL is not set. See .env.example.');
  process.exit(1);
}

await mongoose.connect(MONGO_URL);
console.log('Connected to MongoDB');

const app = createApp({
  store: { getByUser: getStorageByUserId, updateByUser: updateStorageByUserId, add: addNewStorage },
  log: createLogger(LOGGING_SERVICE_URL),
});

app.listen(PORT, () => {
  console.log(`Storage service running on port ${PORT}`);
});
