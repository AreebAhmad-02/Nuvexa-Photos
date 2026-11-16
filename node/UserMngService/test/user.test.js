import assert from 'node:assert/strict';
import { test } from 'node:test';

import request from 'supertest';

import { createApp } from '../app.js';

/** A fake User model holding users in memory. */
function fakeUserModel(users = []) {
  return {
    create: async (user) => {
      if (users.some((u) => u.email === user.email)) {
        throw Object.assign(new Error('duplicate'), { code: 11000 });
      }
      users.push({ _id: String(users.length + 1), ...user });
    },
    findOne: async ({ email }) => users.find((u) => u.email === email) ?? null,
  };
}

const deps = (users) => ({
  User: fakeUserModel(users),
  hash: async (password) => `hashed:${password}`,
  compare: async (password, hashed) => hashed === `hashed:${password}`,
  log: async () => {},
});

test('register requires an email and a password', async () => {
  const res = await request(createApp(deps())).post('/api/user/register').send({ name: 'A' });
  assert.equal(res.status, 400);
});

test('register stores a hashed password and rejects a duplicate email', async () => {
  const users = [];
  const app = createApp(deps(users));
  const body = { name: 'A', email: 'a@x.com', password: 'secret' };

  assert.equal((await request(app).post('/api/user/register').send(body)).status, 201);
  assert.equal(users[0].password, 'hashed:secret');
  assert.equal((await request(app).post('/api/user/register').send(body)).status, 409);
});

test('login rejects a wrong password', async () => {
  const users = [{ _id: '1', email: 'a@x.com', password: 'hashed:secret' }];
  const res = await request(createApp(deps(users)))
    .post('/api/user/login')
    .send({ email: 'a@x.com', password: 'wrong' });
  assert.equal(res.status, 401);
});

test('login never returns the password hash', async () => {
  const users = [{ _id: '1', name: 'A', email: 'a@x.com', password: 'hashed:secret' }];
  const res = await request(createApp(deps(users)))
    .post('/api/user/login')
    .send({ email: 'a@x.com', password: 'secret' });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data, { _id: '1', name: 'A', email: 'a@x.com' });
});
