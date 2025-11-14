import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { loadEnv } from '../config/env.js';

describe('Auth integration', () => {
  const app = createApp();
  beforeAll(async () => {
    const env = loadEnv();
    await mongoose.connect(env.MONGO_URI);
  });
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('registers and logs in a user', async () => {
    const email = `test_${Date.now()}@hrms.local`;
    const password = 'StrongPass!1234';
    const reg = await request(app).post('/api/auth/register').send({ email, password });
    expect(reg.status).toBe(201);
    const login = await request(app).post('/api/auth/login').send({ email, password });
    expect(login.status).toBe(200);
    expect(login.body.accessToken).toBeTruthy();
    expect(login.headers['set-cookie']).toBeDefined();
  });
});


