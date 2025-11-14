import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { loadEnv } from '../config/env.js';
import { registerUser } from '../services/authService.js';

describe('Employees API', () => {
  const app = createApp();
  let accessToken = '';
  beforeAll(async () => {
    const env = loadEnv();
    await mongoose.connect(env.MONGO_URI);
    const email = `hr_${Date.now()}@hrms.local`;
    const reg = await registerUser(email, 'StrongPass!1234', ['ADMIN']);
    accessToken = reg.accessToken;
  });
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('CRUD employee', async () => {
    const create = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ employeeId: 'E-' + Date.now(), name: 'Jane Doe', email: `jane${Date.now()}@corp.local` });
    expect(create.status).toBe(201);
    const id = create.body.employee._id || create.body.employee.id;
    const get = await request(app).get(`/api/employees/${id}`).set('Authorization', `Bearer ${accessToken}`);
    expect(get.status).toBe(200);
    const list = await request(app).get('/api/employees').set('Authorization', `Bearer ${accessToken}`);
    expect(list.status).toBe(200);
    const patch = await request(app)
      .patch(`/api/employees/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'inactive' });
    expect(patch.status).toBe(200);
    const del = await request(app).delete(`/api/employees/${id}`).set('Authorization', `Bearer ${accessToken}`);
    expect(del.status).toBe(204);
  });
});


