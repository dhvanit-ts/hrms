import prisma from "@/config/db.js";
import { writeAuditLog } from "@/infra/services/audit.service";

export async function listEmployees() {
  return prisma.employee.findMany({
    include: {
      department: true,
      jobRole: true,
    }
  });
}

export async function getEmployee(id: number) {
  return prisma.employee.findUnique({
    where: { id },
    include: {
      department: true,
      jobRole: true,
    }
  });
}

export async function createEmployee(data: {
  employeeId: string;
  name: string;
  email: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  departmentId?: number | null;
  jobRoleId?: number | null;
  hireDate?: string | null;
  salary?: number | null;
  leaveAllowance?: number | null;
}) {
  const created = await prisma.employee.create({
    data: {
      employeeId: data.employeeId,
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      departmentId: data.departmentId,
      jobRoleId: data.jobRoleId,
      hireDate: data.hireDate ? new Date(data.hireDate) : null,
      salary: data.salary,
      leaveAllowance: data.leaveAllowance || 20, // Default to 20 days
    },
    include: {
      department: true,
      jobRole: true,
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
  console.log(data)
  const updated = await prisma.employee.update({
    where: { id },
    data,
    include: {
      department: true,
      jobRole: true,
    }
  });

  await writeAuditLog({
    action: "UPDATE",
    entity: "Employee",
    entityId: id.toString(),
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
