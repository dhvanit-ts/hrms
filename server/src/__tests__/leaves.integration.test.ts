import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { loadEnv } from '../config/env.js';
import { registerUser } from '../services/authService.js';
import { Employee } from '../models/Employee.js';

describe('Leaves API', () => {
  const app = createApp();
  let employeeId = '';
  let approverToken = '';
  let employeeToken = '';
  beforeAll(async () => {
    const env = loadEnv();
    await mongoose.connect(env.MONGO_URI);
    const empEmail = `emp_${Date.now()}@hrms.local`;
    const apprEmail = `mgr_${Date.now()}@hrms.local`;
    const empReg = await registerUser(empEmail, 'StrongPass!1234', ['EMPLOYEE']);
    const apprReg = await registerUser(apprEmail, 'StrongPass!1234', ['MANAGER']);
    employeeToken = empReg.accessToken;
    approverToken = apprReg.accessToken;
    const emp = await Employee.create({
      employeeId: 'E' + Date.now(),
      name: 'Emp User',
      email: empEmail,
      status: 'active'
    });
    employeeId = emp.id;
  });
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('employee applies, manager approves', async () => {
    const apply = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ employeeId, type: 'annual', startDate: '2025-01-10', endDate: '2025-01-12' });
    expect(apply.status).toBe(201);
    const id = apply.body.leave._id || apply.body.leave.id;
    const pending = await request(app).get('/api/leaves/pending').set('Authorization', `Bearer ${approverToken}`);
    expect(pending.status).toBe(200);
    const approve = await request(app)
      .patch(`/api/leaves/${id}/status`)
      .set('Authorization', `Bearer ${approverToken}`)
      .send({ status: 'approved' });
    expect(approve.status).toBe(200);
    const balance = await request(app)
      .get('/api/leaves/balance')
      .set('Authorization', `Bearer ${employeeToken}`)
      .query({ employeeId });
    expect(balance.status).toBe(200);
    expect(balance.body.balance).toBeTruthy();
  });
});


