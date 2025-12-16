import prisma from "@/config/db.js";
import { writeAuditLog } from "@/infra/services/audit.service";
import ApiError from "@/core/http/ApiError.js";

export async function listDepartments() {
  return prisma.department.findMany({
    include: {
      _count: {
        select: {
          employees: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });
}

export async function getDepartment(id: number) {
  return prisma.department.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          employees: true
        }
      }
    }
  });
}

export async function createDepartment(data: {
  name: string;
}) {
  // Check if department name already exists
  const existing = await prisma.department.findFirst({
    where: {
      name: {
        equals: data.name,
      }
    }
  });

  if (existing) {
    throw new ApiError({
      statusCode: 409,
      code: "DEPARTMENT_EXISTS",
      message: "Department with this name already exists",
    });
  }

  const created = await prisma.department.create({
    data: {
      name: data.name,
    },
    include: {
      _count: {
        select: {
          employees: true
        }
      }
    }
  });

  await writeAuditLog({
    action: "CREATE",
    entity: "Department",
    entityId: created.id.toString(),
    metadata: { name: data.name },
  });

  return created;
}

export async function updateDepartment(id: number, data: {
  name?: string;
  description?: string;
}) {
  // Check if department exists
  const existing = await getDepartment(id);
  if (!existing) {
    throw new ApiError({
      statusCode: 404,
      code: "DEPARTMENT_NOT_FOUND",
      message: "Department not found",
    });
  }

  // Check if new name conflicts with existing department
  if (data.name && data.name !== existing.name) {
    const nameConflict = await prisma.department.findFirst({
      where: {
        name: {
          equals: data.name,
        },
        id: { not: id }
      }
    });

    if (nameConflict) {
      throw new ApiError({
        statusCode: 409,
        code: "DEPARTMENT_EXISTS",
        message: "Department with this name already exists",
      });
    }
  }

  const updated = await prisma.department.update({
    where: { id },
    data,
    include: {
      _count: {
        select: {
          employees: true
        }
      }
    }
  });

  await writeAuditLog({
    action: "UPDATE",
    entity: "Department",
    entityId: id.toString(),
    metadata: { name: data.name || existing.name },
  });

  return updated;
}

export async function deleteDepartment(id: number) {
  // Check if department exists
  const existing = await getDepartment(id);
  if (!existing) {
    throw new ApiError({
      statusCode: 404,
      code: "DEPARTMENT_NOT_FOUND",
      message: "Department not found",
    });
  }

  // Check if department has employees
  if (existing._count.employees > 0) {
    throw new ApiError({
      statusCode: 409,
      code: "DEPARTMENT_HAS_EMPLOYEES",
      message: "Cannot delete department with assigned employees",
    });
  }

  await prisma.department.delete({
    where: { id }
  });

  await writeAuditLog({
    action: "DELETE",
    entity: "Department",
    entityId: id.toString(),
    metadata: { name: existing.name },
  });

  return { success: true };
}