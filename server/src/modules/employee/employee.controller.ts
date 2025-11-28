import type { Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "@/core/middlewares/auth.js";
import {
  createEmployee,
  getEmployee,
  listEmployees,
  removeEmployee,
  updateEmployee,
} from "@/modules/employee/employee.service.js";

export const createEmployeeSchema = z.object({
  body: z.object({
    employeeId: z.string().min(1),
    name: z.string().min(1),
    email: z.email(),
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
    departmentId: z.string().optional(),
    jobRoleId: z.string().optional(),
    hireDate: z.string().optional(),
  }),
});

export async function createEmp(_req: AuthenticatedRequest, res: Response) {
  const created = await createEmployee(_req.body);
  res.status(201).json({ employee: created });
}

export async function listEmp(_req: AuthenticatedRequest, res: Response) {
  const items = await listEmployees();
  res.json({ employees: items });
}

export async function getEmp(req: AuthenticatedRequest, res: Response) {
  const item = await getEmployee(Number(req.params.id));
  if (!item) return res.status(404).json({ error: "NotFound" });
  res.json({ employee: item });
}

export const updateEmployeeSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    status: z.enum(["active", "inactive", "terminated"]).optional(),
  }),
});

export async function updateEmp(req: AuthenticatedRequest, res: Response) {
  const updated = await updateEmployee(Number(req.params.id), req.body);
  res.json({ employee: updated });
}

export async function removeEmp(req: AuthenticatedRequest, res: Response) {
  await removeEmployee(Number(req.params.id));
  res.status(204).send();
}
