import { Types } from 'mongoose';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { writeAuditLog } from './auditService.js';

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export async function applyLeave(params: {
  employeeId: string;
  type: string;
  startDate: string;
  endDate: string;
  reason?: string;
}) {
  const created = await LeaveRequest.create({
    employeeId: new Types.ObjectId(params.employeeId),
    type: params.type,
    startDate: new Date(params.startDate),
    endDate: new Date(params.endDate),
    reason: params.reason
  });
  await writeAuditLog({
    action: 'CREATE',
    entity: 'LeaveRequest',
    entityId: created.id,
    metadata: { type: params.type }
  });
  return created.toJSON();
}

export async function listMyLeaves(employeeId: string) {
  return LeaveRequest.find({ employeeId: new Types.ObjectId(employeeId) })
    .sort({ createdAt: -1 })
    .lean();
}

export async function listPendingLeaves() {
  return LeaveRequest.find({ status: 'pending' }).sort({ createdAt: 1 }).lean();
}

export async function setLeaveStatus(params: {
  id: string;
  status: LeaveStatus;
  approverId: string;
}) {
  await LeaveRequest.updateOne(
    { _id: new Types.ObjectId(params.id) },
    { $set: { status: params.status, approverId: new Types.ObjectId(params.approverId) } }
  ).exec();
  await writeAuditLog({
    action: params.status === 'approved' ? 'APPROVE' : 'REJECT',
    entity: 'LeaveRequest',
    entityId: params.id,
    performedBy: params.approverId
  });
  return LeaveRequest.findById(params.id).lean();
}

// Simple leave balance: 20 days per calendar year - approved days this year
export async function getLeaveBalance(employeeId: string, year: number = new Date().getFullYear()) {
  const start = new Date(`${year}-01-01T00:00:00.000Z`);
  const end = new Date(`${year}-12-31T23:59:59.999Z`);
  const approved = await LeaveRequest.find({
    employeeId: new Types.ObjectId(employeeId),
    status: 'approved',
    startDate: { $gte: start, $lte: end }
  }).lean();
  const usedDays = approved.reduce((sum, r) => {
    const diff = Math.ceil((new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return sum + Math.max(0, diff);
  }, 0);
  const allowance = 20;
  return { year, allowance, usedDays, remaining: Math.max(0, allowance - usedDays) };
}


