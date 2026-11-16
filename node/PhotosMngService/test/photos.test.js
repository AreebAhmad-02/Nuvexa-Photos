import assert from 'node:assert/strict';
import { test } from 'node:test';

import request from 'supertest';

import { createApp } from '../app.js';

const MB = 1024 * 1024;

/** A fake quota counter that records every update. */
function fakeCounter(start = 0) {
  const counter = { value: start, updates: [] };
  counter.get = async () => counter.value;
  counter.set = async (userId, total) => {
    counter.updates.push(total);
    counter.value = total;
  };
  return counter;
}

/** Build the app with in-memory fakes; override any dependency per test. */
function setup(overrides = {}) {
  const photos = [];
  const deps = {
    Photos: {
      create: async (doc) => {
        const photo = { _id: String(photos.length + 1), ...doc };
        photos.push(photo);
        return photo;
      },
      find: async (query = {}) => photos.filter((p) => !query.userId || p.userId === query.userId),
      findById: async (id) => photos.find((p) => p._id === id) ?? null,
      findByIdAndDelete: async (id) =>
        photos.splice(
          photos.findIndex((p) => p._id === id),
          1,
        ),
    },
    storage: fakeCounter(),
    usage: fakeCounter(),
    media: {
      upload: async () => ({ url: 'http://img/1', publicId: 'p1' }),
      remove: async () => {},
    },
    limits: { storage: 10 * MB, dailyUsage: 25 * MB },
    log: async () => {},
    ...overrides,
  };
  return { app: createApp(deps), deps, photos };
}

const uploadOf = (app, bytes) =>
  request(app)
    .post('/api/photo/upload')
    .field('userId', 'u1')
    .attach('image', Buffer.alloc(bytes), 'photo.png');

test('rejects a request without a file', async () => {
  const { app } = setup();
  const res = await request(app).post('/api/photo/upload').field('userId', 'u1');
  assert.equal(res.status, 400);
});

test('uploads a photo and adds its size to both counters', async () => {
  const { app, deps, photos } = setup();
  const res = await uploadOf(app, 1000);
  assert.equal(res.status, 200);
  assert.equal(photos.length, 1);
  assert.equal(deps.storage.value, 1000);
  assert.equal(deps.usage.value, 1000);
});

test('refuses an upload that would exceed the storage limit', async () => {
  let uploaded = false;
  const { app, deps } = setup({
    storage: fakeCounter(10 * MB - 10),
    media: { upload: async () => (uploaded = true), remove: async () => {} },
  });
  const res = await uploadOf(app, 100);
  assert.equal(res.status, 403);
  assert.match(res.body.msg, /10 MB/);
  assert.equal(uploaded, false);
  assert.deepEqual(deps.storage.updates, []);
});

test('does not use up quota when the file upload fails', async () => {
  const { app, deps } = setup({
    media: {
      upload: async () => {
        throw new Error('Cloudinary down');
      },
      remove: async () => {},
    },
  });
  const res = await uploadOf(app, 1000);
  assert.equal(res.status, 500);
  assert.deepEqual(deps.storage.updates, []);
  assert.deepEqual(deps.usage.updates, []);
});

test('returns 502 when the quota services cannot be reached', async () => {
  const unreachable = {
    get: async () => {
      throw new Error('ECONNREFUSED');
    },
    set: async () => {},
  };
  const { app } = setup({ storage: unreachable });
  const res = await uploadOf(app, 1000);
  assert.equal(res.status, 502);
});

test('deleting a photo gives its bytes back to storage', async () => {
  const { app, deps } = setup();
  await uploadOf(app, 1000);
  const res = await request(app).delete('/api/photo/1');
  assert.equal(res.status, 200);
  assert.equal(deps.storage.value, 0);
});
