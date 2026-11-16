/** Entry point: connects to MongoDB, starts the Usage service and its daily reset job. */
import 'dotenv/config';

import mongoose from 'mongoose';

import { createApp } from './app.js';
import { scheduleDailyReset } from './dailyReset.js';
import { createLogger } from './logClient.js';
import {
  addNewUsage,
  getUsageByUserId,
  updateUsageByUserId,
  usageModel,
} from './model/usageModel.js';

const PORT = Number(process.env.PORT ?? 8003);
const { MONGO_URL } = process.env;
const LOGGING_SERVICE_URL = process.env.LOGGING_SERVICE_URL ?? 'http://loggingservice-srv:8004/log';

if (!MONGO_URL) {
  console.error('MONGO_URL is not set. See .env.example.');
  process.exit(1);
}

await mongoose.connect(MONGO_URL);
console.log('Connected to MongoDB');

const app = createApp({
  store: { getByUser: getUsageByUserId, updateByUser: updateUsageByUserId, add: addNewUsage },
  log: createLogger(LOGGING_SERVICE_URL),
});
scheduleDailyReset(usageModel);

app.listen(PORT, () => {
  console.log(`Usage service running on port ${PORT}`);
});
