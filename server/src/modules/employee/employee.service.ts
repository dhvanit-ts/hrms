import prisma from "@/config/db.js";
import { writeAuditLog } from "@/infra/services/audit.service";

export async function listEmployees() {
  return prisma.employee.findMany({
    include: {
      department: true,
      jobRole: true,
      shift: true,
    }
  });
}

export async function getEmployee(id: number) {
  return prisma.employee.findUnique({
    where: { id },
    include: {
      department: true,
      jobRole: true,
      shift: true,
    }
  });
}

export async function createEmployee(data: {
  name: string;
  email: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  departmentId?: number | null;
  jobRoleId?: number | null;
  hireDate?: string | null;
  terminationDate?: string | null;
  salary?: number | null;
  leaveAllowance?: number | null;
}) {

  const employeeCount = await prisma.employee.count();
  const employeeId = `E-${(employeeCount + 1).toString()}`;

  const created = await prisma.employee.create({
    data: {
      employeeId,
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      departmentId: data.departmentId,
      jobRoleId: data.jobRoleId,
      hireDate: data.hireDate ? new Date(data.hireDate) : null,
      terminationDate: data.terminationDate ? new Date(data.terminationDate) : null,
      salary: data.salary,
      leaveAllowance: data.leaveAllowance || 20, // Default to 20 days
    },
    include: {
      department: true,
      jobRole: true,
      shift: true,
    }
  });

  await writeAuditLog({
    action: "CREATE",
    entity: "Employee",
    entityId: created.id.toString(),
  });

  return created;
}

export async function updateEmployee(id: number, data: any) {
  // Get current employee data to check for status changes
  const currentEmployee = await prisma.employee.findUnique({
    where: { id },
    select: { status: true, terminationDate: true }
  });

  if (!currentEmployee) {
    throw new Error("Employee not found");
  }

  // Handle automatic termination date setting
  if (data.status === "terminated" && currentEmployee.status !== "terminated") {
    // Employee is being terminated - set termination date to today if not already set
    if (!data.terminationDate && !currentEmployee.terminationDate) {
      data.terminationDate = new Date();
    }
  } else if (data.status !== "terminated" && currentEmployee.status === "terminated") {
    // Employee is being reactivated - clear termination date if not explicitly set
    if (!data.terminationDate) {
      data.terminationDate = null;
    }
  }

  const updated = await prisma.employee.update({
    where: { id },
    data,
    include: {
      department: true,
      jobRole: true,
      shift: true,
    }
  });

  await writeAuditLog({
    action: "UPDATE",
    entity: "Employee",
    entityId: id.toString(),
    metadata: currentEmployee.status !== data.status ? {
      statusChange: `${currentEmployee.status} -> ${data.status}`,
      terminationDateSet: data.status === "terminated" && data.terminationDate ? true : false
    } : undefined,
  });

  return updated;
}

export async function removeEmployee(id: number) {
  await prisma.employee.delete({ where: { id } });
  await writeAuditLog({
    action: "DELETE",
    entity: "Employee",
    entityId: id.toString(),
  });
}
