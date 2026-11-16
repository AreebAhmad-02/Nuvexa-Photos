/** Entry point: connects to MongoDB and starts the User service. */
import 'dotenv/config';

import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

import { createApp } from './app.js';
import { createLogger } from './logClient.js';
import User from './model/user.js';

const PORT = Number(process.env.PORT ?? 8000);
const { MONGO_URL } = process.env;
const LOGGING_SERVICE_URL = process.env.LOGGING_SERVICE_URL ?? 'http://loggingservice-srv:8004/log';

if (!MONGO_URL) {
  console.error('MONGO_URL is not set. See .env.example.');
  process.exit(1);
}

await mongoose.connect(MONGO_URL);
console.log('Connected to MongoDB');

const app = createApp({
  User,
  hash: bcrypt.hash,
  compare: bcrypt.compare,
  log: createLogger(LOGGING_SERVICE_URL),
});

app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
});
