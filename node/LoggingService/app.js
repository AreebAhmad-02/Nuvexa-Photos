/**
 * Logging service: receives log events from the other services over HTTP and
 * appends them to a log file, one line per event.
 */
import express from 'express';

/**
 * Build the Express app.
 * @param {object} deps
 * @param {(line: string) => Promise<void>} deps.appendLog writes one line to the log store
 * @returns {import('express').Express}
 */
export function createApp({ appendLog }) {
  const app = express();
  app.use(express.json());

  // POST /log  body: { event?: string, message: string }
  app.post('/log', async (req, res) => {
    const { event, message } = req.body ?? {};
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const label = event ? `[${event}] ` : '';
    const line = `${new Date().toISOString()} - ${label}${message}\n`;
    try {
      await appendLog(line);
      return res.json({ message: 'Log entry added successfully' });
    } catch (error) {
      console.error('Error writing to log file:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  return app;
}
