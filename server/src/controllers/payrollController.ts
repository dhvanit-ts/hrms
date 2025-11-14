import type { Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../middlewares/auth.js';
import { generatePayslip, listPayrollForEmployee, upsertPayroll } from '../services/payrollService.js';

export const upsertPayrollSchema = z.object({
  body: z.object({
    employeeId: z.string().min(1),
    salary: z.number().positive(),
    allowances: z.number().min(0).optional(),
    deductions: z.number().min(0).optional(),
    payDate: z.string().min(1)
  })
});

export async function upsertPayrollHandler(_req: AuthenticatedRequest, res: Response) {
  const doc = await upsertPayroll(_req.body);
  res.status(200).json({ payroll: doc });
}

export const listEmpPayrollSchema = z.object({
  params: z.object({ employeeId: z.string().min(1) })
});

export async function listEmployeePayroll(req: AuthenticatedRequest, res: Response) {
  const items = await listPayrollForEmployee(req.params.employeeId);
  res.json({ items });
}

export const payslipSchema = z.object({
  params: z.object({ id: z.string().min(1) })
});

export async function payslipHandler(req: AuthenticatedRequest, res: Response) {
  const slip = await generatePayslip(req.params.id);
  res.json({ payslip: slip });
}


