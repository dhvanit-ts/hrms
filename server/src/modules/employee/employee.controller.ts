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
import {
  EmployeeDTO,
  CreateEmployeeSchema,
  UpdateEmployeeSchema,
} from "./employee.dto.js";

export const createEmployeeSchemaWithBody = z.object({
  body: CreateEmployeeSchema,
});

export async function createEmp(req: AuthenticatedRequest, res: Response) {
  const validatedData = EmployeeDTO.validateCreateData(req.body);
  const created = await createEmployee(validatedData);
  const employeeDTO = EmployeeDTO.toEmployeeProfile(created);
  res.status(201).json({ employee: employeeDTO });
}

export async function listEmp(_req: AuthenticatedRequest, res: Response) {
  const items = await listEmployees();
  const employeesDTO = EmployeeDTO.toEmployeeList(items);
  res.json({ employees: employeesDTO });
}

export async function getEmp(req: AuthenticatedRequest, res: Response) {
  const item = await getEmployee(Number(req.params.id));
  if (!item) return res.status(404).json({ error: "NotFound" });
  const employeeDTO = EmployeeDTO.toEmployeeProfile(item);
  res.json({ employee: employeeDTO });
}

export const updateEmployeeSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: UpdateEmployeeSchema,
});

export async function updateEmp(req: AuthenticatedRequest, res: Response) {
  const validatedData = EmployeeDTO.validateUpdateData(req.body);
  const prismaData = EmployeeDTO.transformUpdateDataForPrisma(validatedData);
  const updated = await updateEmployee(Number(req.params.id), prismaData);
  const employeeDTO = EmployeeDTO.toEmployeeProfile(updated);
  res.json({ employee: employeeDTO });
}

export async function removeEmp(req: AuthenticatedRequest, res: Response) {
  await removeEmployee(Number(req.params.id));
  res.status(204).send();
}

export async function getMe(req: AuthenticatedRequest, res: Response) {
  const employeeId = req.user?.id;
  if (!employeeId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const employee = await getEmployee(Number(employeeId));
  if (!employee) {
    return res.status(404).json({ error: "Employee not found" });
  }
  const employeeDTO = EmployeeDTO.toEmployeeProfile(employee);
  res.json({ employee: employeeDTO });
}
