import prisma from "@/config/db.js";
import { writeAuditLog } from "./auditService.js";

export async function listEmployees() {
  return prisma.employee.findMany();
}

export async function getEmployee(id: number) {
  return prisma.employee.findUnique({ where: { id } });
}

export async function createEmployee(data: {
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  departmentId?: number;
  jobRoleId?: number;
  hireDate?: string;
}) {
  const created = await prisma.employee.create({
    data: {
      employeeId: data.employeeId,
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      departmentId: data.departmentId,
      jobRoleId: data.jobRoleId,
      hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
    },
  });

  await writeAuditLog({
    action: "CREATE",
    entity: "Employee",
    entityId: created.id.toString(),
  });

  return created;
}

export async function updateEmployee(
  id: number,
  data: Partial<{
    name: string;
    email: string;
    phone: string;
    status: "active" | "inactive" | "terminated";
  }>
) {
  if (data.email) data.email = data.email.toLowerCase();

  const updated = await prisma.employee.update({
    where: { id },
    data,
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
