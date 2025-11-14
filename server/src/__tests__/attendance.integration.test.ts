import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { loadEnv } from '../config/env.js';
import { registerUser } from '../services/authService.js';
import { Employee } from '../models/Employee.js';

describe('Attendance API', () => {
  const app = createApp();
  let employeeId = '';
  let empToken = '';
  let mgrToken = '';
  beforeAll(async () => {
    const env = loadEnv();
    await mongoose.connect(env.MONGO_URI);
    const empEmail = `att_emp_${Date.now()}@hrms.local`;
    const mgrEmail = `att_mgr_${Date.now()}@hrms.local`;
    const empReg = await registerUser(empEmail, 'StrongPass!1234', ['EMPLOYEE']);
    const mReg = await registerUser(mgrEmail, 'StrongPass!1234', ['MANAGER']);
    empToken = empReg.accessToken;
    mgrToken = mReg.accessToken;
    const emp = await Employee.create({
      employeeId: 'E' + Date.now(),
      name: 'Att User',
      email: empEmail,
      status: 'active'
    });
    employeeId = emp.id;
  });
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('check-in, check-out and summary', async () => {
    const ci = await request(app).post('/api/attendance/check-in').set('Authorization', `Bearer ${empToken}`).send({ employeeId });
    expect(ci.status).toBe(200);
    const co = await request(app).post('/api/attendance/check-out').set('Authorization', `Bearer ${empToken}`).send({ employeeId });
    expect(co.status).toBe(200);
    const date = new Date().toISOString().slice(0, 10);
    const sum = await request(app).get('/api/attendance/summary').set('Authorization', `Bearer ${mgrToken}`).query({ date });
    expect(sum.status).toBe(200);
    expect(Array.isArray(sum.body.items)).toBe(true);
  });
});


