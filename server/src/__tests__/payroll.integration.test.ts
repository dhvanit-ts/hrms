import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { loadEnv } from '../config/env.js';
import { registerUser } from '../services/authService.js';
import { Employee } from '../models/Employee.js';

describe('Payroll API', () => {
  const app = createApp();
  let employeeId = '';
  let hrToken = '';
  beforeAll(async () => {
    const env = loadEnv();
    await mongoose.connect(env.MONGO_URI);
    const hrEmail = `hr_${Date.now()}@hrms.local`;
    const hrReg = await registerUser(hrEmail, 'StrongPass!1234', ['HR']);
    hrToken = hrReg.accessToken;
    const emp = await Employee.create({
      employeeId: 'P' + Date.now(),
      name: 'Payroll User',
      email: `pay_${Date.now()}@hrms.local`,
      status: 'active'
    });
    employeeId = emp.id;
  });
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('upserts payroll and generates payslip', async () => {
    const pd = { employeeId, salary: 5000, allowances: 250, deductions: 100, payDate: '2025-01-31' };
    const up = await request(app).post('/api/payroll').set('Authorization', `Bearer ${hrToken}`).send(pd);
    expect(up.status).toBe(200);
    const list = await request(app).get(`/api/payroll/employee/${employeeId}`).set('Authorization', `Bearer ${hrToken}`);
    expect(list.status).toBe(200);
    const id = list.body.items[0]._id || list.body.items[0].id;
    const slip = await request(app).get(`/api/payroll/${id}/payslip`).set('Authorization', `Bearer ${hrToken}`);
    expect(slip.status).toBe(200);
    expect(slip.body.payslip.breakdown.net).toBe(5000 + 250 - 100);
  });
});


