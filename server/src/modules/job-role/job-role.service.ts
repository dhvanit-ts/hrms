import prisma from "@/config/db.js";
import { writeAuditLog } from "@/infra/services/audit.service";
import ApiError from "@/core/http/ApiError.js";

export async function listJobRoles(includeInactive = false) {
  return prisma.jobRole.findMany({
    where: includeInactive ? {} : { isActive: true },
    include: {
      _count: {
        select: {
          employees: true
        }
      }
    },
    orderBy: { title: 'asc' }
  });
}

export async function getJobRole(id: number) {
  return prisma.jobRole.findUnique({
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

export async function createJobRole(data: {
  title: string;
  level?: number;
  isActive?: boolean;
}) {
  // Check if job role title already exists
  const existing = await prisma.jobRole.findFirst({
    where: {
      title: {
        equals: data.title,
      }
    }
  });

  if (existing) {
    throw new ApiError({
      statusCode: 409,
      code: "JOB_ROLE_EXISTS",
      message: "Job role with this title already exists",
    });
  }

  const created = await prisma.jobRole.create({
    data: {
      title: data.title,
      isActive: data.isActive ?? true,
      level: data.level
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
    entity: "JobRole",
    entityId: created.id.toString(),
    metadata: { title: data.title },
  });

  return created;
}

export async function updateJobRole(id: number, data: {
  title?: string;
  description?: string;
  isActive?: boolean;
}) {
  // Check if job role exists
  const existing = await getJobRole(id);
  if (!existing) {
    throw new ApiError({
      statusCode: 404,
      code: "JOB_ROLE_NOT_FOUND",
      message: "Job role not found",
    });
  }

  // Check if new title conflicts with existing job role
  if (data.title && data.title !== existing.title) {
    const titleConflict = await prisma.jobRole.findFirst({
      where: {
        title: {
          equals: data.title,
        },
        id: { not: id }
      }
    });

    if (titleConflict) {
      throw new ApiError({
        statusCode: 409,
        code: "JOB_ROLE_EXISTS",
        message: "Job role with this title already exists",
      });
    }
  }

  const updated = await prisma.jobRole.update({
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
    entity: "JobRole",
    entityId: id.toString(),
    metadata: { title: data.title || existing.title },
  });

  return updated;
}

export async function deleteJobRole(id: number) {
  // Check if job role exists
  const existing = await getJobRole(id);
  if (!existing) {
    throw new ApiError({
      statusCode: 404,
      code: "JOB_ROLE_NOT_FOUND",
      message: "Job role not found",
    });
  }

  // Check if job role has employees
  if (existing._count.employees > 0) {
    throw new ApiError({
      statusCode: 409,
      code: "JOB_ROLE_HAS_EMPLOYEES",
      message: "Cannot delete job role with assigned employees",
    });
  }

  await prisma.jobRole.delete({
    where: { id }
  });

  await writeAuditLog({
    action: "DELETE",
    entity: "JobRole",
    entityId: id.toString(),
    metadata: { title: existing.title },
  });

  return { success: true };
}