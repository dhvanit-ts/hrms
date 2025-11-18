import prisma from "@/config/db.js";
import { writeAuditLog } from "./auditService.js";
import { Decimal } from "@prisma/client/runtime/library.js";

// Upsert payroll record
export async function upsertPayroll(data: {
  employeeId: number;
  salary: number;
  allowances?: number;
  deductions?: number;
  payDate: string;
}) {
  const payDate = new Date(data.payDate);

  // Upsert using unique compound key: employeeId + payDate
  const existing = await prisma.payroll.findFirst({
    where: { employeeId: data.employeeId, payDate },
  });

  const doc = existing
    ? await prisma.payroll.update({
        where: { id: existing.id },
        data: {
          salary: data.salary,
          allowances: data.allowances ?? 0,
          deductions: data.deductions ?? 0,
          payDate,
        },
      })
    : await prisma.payroll.create({
        data: {
          employeeId: data.employeeId,
          salary: data.salary,
          allowances: data.allowances ?? 0,
          deductions: data.deductions ?? 0,
          payDate,
        },
      });

  await writeAuditLog({
    action: "UPSERT",
    entity: "Payroll",
    entityId: doc.id.toString(),
  });

  return doc;
}

// List payroll records for an employee
export async function listPayrollForEmployee(employeeId: number) {
  return prisma.payroll.findMany({
    where: { employeeId },
    orderBy: { payDate: "desc" },
  });
}

// Generate payslip
export async function generatePayslip(id: number) {
  const p = await prisma.payroll.findUnique({ where: { id } });
  if (!p) throw new Error("Not found");

  const gross = p.salary.add(new Decimal(p.allowances ?? 0));
  const net = gross.sub(new Decimal(p.deductions ?? 0));

  return {
    id: p.id.toString(),
    employeeId: p.employeeId,
    payDate: p.payDate,
    breakdown: {
      salary: p.salary,
      allowances: p.allowances ?? 0,
      deductions: p.deductions ?? 0,
      gross,
      net,
    },
  };
}
