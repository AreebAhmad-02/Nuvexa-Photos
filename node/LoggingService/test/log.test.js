import assert from 'node:assert/strict';
import { test } from 'node:test';

import request from 'supertest';

import { createApp } from '../app.js';

test('rejects a log event without a message', async () => {
  const app = createApp({ appendLog: async () => {} });
  const res = await request(app).post('/log').send({ event: 'Upload' });
  assert.equal(res.status, 400);
});

test('writes one line containing the event and the message', async () => {
  const lines = [];
  const app = createApp({ appendLog: async (line) => lines.push(line) });
  const res = await request(app).post('/log').send({ event: 'Upload', message: 'ok' });
  assert.equal(res.status, 200);
  assert.equal(lines.length, 1);
  assert.match(lines[0], /\[Upload\] ok\n$/);
});

test('returns 500 when the log file cannot be written', async () => {
  const app = createApp({
    appendLog: async () => {
      throw new Error('disk full');
    },
  });
  const res = await request(app).post('/log').send({ message: 'ok' });
  assert.equal(res.status, 500);
});
