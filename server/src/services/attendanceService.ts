import { Types } from 'mongoose';
import { Attendance } from '../models/Attendance.js';
import { writeAuditLog } from './auditService.js';

export async function checkIn(employeeId: string, date?: string) {
  const d = date ? new Date(date) : new Date();
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const existing = await Attendance.findOne({ employeeId: new Types.ObjectId(employeeId), date: day });
  if (existing?.checkIn) throw new Error('Already checked in');
  const item =
    existing ||
    (await Attendance.create({
      employeeId: new Types.ObjectId(employeeId),
      date: day
    }));
  item.checkIn = new Date();
  await item.save();
  await writeAuditLog({ action: 'CHECK_IN', entity: 'Attendance', entityId: item.id, performedBy: employeeId });
  return item.toJSON();
}

export async function checkOut(employeeId: string, date?: string) {
  const d = date ? new Date(date) : new Date();
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const item = await Attendance.findOne({ employeeId: new Types.ObjectId(employeeId), date: day });
  if (!item?.checkIn) throw new Error('Not checked in');
  if (item.checkOut) throw new Error('Already checked out');
  item.checkOut = new Date();
  item.duration = Math.max(0, Math.floor((item.checkOut.getTime() - item.checkIn.getTime()) / (1000 * 60)));
  await item.save();
  await writeAuditLog({ action: 'CHECK_OUT', entity: 'Attendance', entityId: item.id, performedBy: employeeId });
  return item.toJSON();
}

export async function dailySummary(date: string) {
  const d = new Date(date);
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const next = new Date(day);
  next.setDate(day.getDate() + 1);
  const items = await Attendance.find({ date: { $gte: day, $lt: next } }).lean();
  return items;
}


