import { writeAuditLog } from "@/infra/services/audit.service";
import prisma from "@/config/db.js";

export async function checkIn(employeeId: string, date?: string) {
  const d = date ? new Date(date) : new Date();
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const eid = parseInt(employeeId);

  const existing = await prisma.attendance.findFirst({
    where: { employeeId: eid, date: day },
  });

  if (existing?.checkIn) {
    throw new Error("Already checked in");
  }

  const record = existing
    ? await prisma.attendance.update({
        where: { id: existing.id },
        data: { checkIn: new Date() },
      })
    : await prisma.attendance.create({
        data: {
          employeeId: eid,
          date: day,
          checkIn: new Date(),
        },
      });

  await writeAuditLog({
    action: "CHECK_IN",
    entity: "Attendance",
    entityId: record.id.toString(),
    performedBy: employeeId,
  });

  return record;
}

export async function checkOut(employeeId: string, date?: string) {
  const d = date ? new Date(date) : new Date();
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const eid = parseInt(employeeId);

  const item = await prisma.attendance.findFirst({
    where: { employeeId: eid, date: day },
  });

  if (!item?.checkIn) throw new Error("Not checked in");
  if (item.checkOut) throw new Error("Already checked out");

  const checkOutTime = new Date();
  const duration = Math.floor(
    (checkOutTime.getTime() - item.checkIn.getTime()) / (1000 * 60)
  );

  const updated = await prisma.attendance.update({
    where: { id: item.id },
    data: {
      checkOut: checkOutTime,
      duration: Math.max(0, duration),
    },
  });

  await writeAuditLog({
    action: "CHECK_OUT",
    entity: "Attendance",
    entityId: updated.id.toString(),
    performedBy: employeeId,
  });

  return updated;
}

export async function dailySummary(date: string) {
  const d = new Date(date);
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const next = new Date(day);
  next.setDate(day.getDate() + 1);

  const items = await prisma.attendance.findMany({
    where: {
      date: {
        gte: day,
        lt: next,
      },
    },
  });

  return items;
}
