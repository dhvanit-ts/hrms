import { Types } from 'mongoose';
import { Payroll } from '../models/Payroll.js';
import { writeAuditLog } from './auditService.js';

export async function upsertPayroll(data: {
  employeeId: string;
  salary: number;
  allowances?: number;
  deductions?: number;
  payDate: string;
}) {
  const doc = await Payroll.findOneAndUpdate(
    { employeeId: new Types.ObjectId(data.employeeId), payDate: new Date(data.payDate) },
    {
      $set: {
        salary: data.salary,
        allowances: data.allowances ?? 0,
        deductions: data.deductions ?? 0,
        employeeId: new Types.ObjectId(data.employeeId),
        payDate: new Date(data.payDate)
      }
    },
    { upsert: true, new: true }
  );
  await writeAuditLog({ action: 'UPSERT', entity: 'Payroll', entityId: doc.id });
  return doc.toJSON();
}

export async function listPayrollForEmployee(employeeId: string) {
  return Payroll.find({ employeeId: new Types.ObjectId(employeeId) }).sort({ payDate: -1 }).lean();
}

export async function generatePayslip(id: string) {
  const p = await Payroll.findById(id).lean();
  if (!p) throw new Error('Not found');
  const gross = p.salary + (p.allowances ?? 0);
  const net = gross - (p.deductions ?? 0);
  return {
    id: p._id?.toString(),
    employeeId: p.employeeId.toString(),
    payDate: p.payDate,
    breakdown: {
      salary: p.salary,
      allowances: p.allowances ?? 0,
      deductions: p.deductions ?? 0,
      gross,
      net
    }
  };
}


