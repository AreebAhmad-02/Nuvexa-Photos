/** Entry point: starts the logging service and writes events to logs.txt. */
import { appendFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createApp } from './app.js';

const PORT = Number(process.env.PORT ?? 8004);
const LOG_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'logs.txt');

const app = createApp({ appendLog: (line) => appendFile(LOG_FILE, line) });

app.listen(PORT, () => {
  console.log(`Logging service running on port ${PORT}`);
});
