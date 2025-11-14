import { Types } from 'mongoose';
import { Employee } from '../models/Employee.js';
import { writeAuditLog } from './auditService.js';

export async function listEmployees() {
  return Employee.find().lean();
}

export async function getEmployee(id: string) {
  return Employee.findById(new Types.ObjectId(id)).lean();
}

export async function createEmployee(data: {
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  departmentId?: string;
  jobRoleId?: string;
  hireDate?: string;
}) {
  const created = await Employee.create({
    employeeId: data.employeeId,
    name: data.name,
    email: data.email.toLowerCase(),
    phone: data.phone,
    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    departmentId: data.departmentId ? new Types.ObjectId(data.departmentId) : undefined,
    jobRoleId: data.jobRoleId ? new Types.ObjectId(data.jobRoleId) : undefined,
    hireDate: data.hireDate ? new Date(data.hireDate) : undefined
  });
  await writeAuditLog({ action: 'CREATE', entity: 'Employee', entityId: created.id });
  return created.toJSON();
}

export async function updateEmployee(id: string, data: Partial<{
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'terminated';
}>) {
  if (data.email) data.email = data.email.toLowerCase();
  await Employee.updateOne({ _id: id }, { $set: data }).exec();
  await writeAuditLog({ action: 'UPDATE', entity: 'Employee', entityId: id });
  return getEmployee(id);
}

export async function removeEmployee(id: string) {
  await Employee.deleteOne({ _id: id }).exec();
  await writeAuditLog({ action: 'DELETE', entity: 'Employee', entityId: id });
}


