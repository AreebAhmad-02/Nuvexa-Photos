import assert from 'node:assert/strict';
import { test } from 'node:test';

import request from 'supertest';

import { createApp } from '../app.js';

/** An in-memory store with the same functions the controller uses. */
function fakeStore(records = []) {
  return {
    getByUser: async (user) => records.find((r) => r.user === user) ?? null,
    updateByUser: async (user, values) => {
      const record = records.find((r) => r.user === user);
      return record ? Object.assign(record, values) : null;
    },
    add: async (values) => {
      records.push(values);
      return values;
    },
  };
}

const appWith = (records) => createApp({ store: fakeStore(records), log: async () => {} });

test('returns 404 for a user with no record', async () => {
  const res = await request(appWith([])).get('/api/usage/user/u1');
  assert.equal(res.status, 404);
});

test('creates, reads and updates a record', async () => {
  const app = appWith([]);
  assert.equal((await request(app).post('/api/usage/').send({ user: 'u1' })).status, 201);
  await request(app).put('/api/usage/user/u1').send({ totalUsage: 500 });
  const res = await request(app).get('/api/usage/user/u1');
  assert.equal(res.body.data.totalUsage, 500);
});

test('rejects a negative total', async () => {
  const res = await request(appWith([{ user: 'u1', totalUsage: 0 }]))
    .put('/api/usage/user/u1')
    .send({ totalUsage: -1 });
  assert.equal(res.status, 400);
});
