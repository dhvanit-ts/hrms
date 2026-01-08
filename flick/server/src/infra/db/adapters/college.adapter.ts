import { and, eq, ilike, or } from "drizzle-orm";
import db from "@/infra/db/index";
import type { DB } from "@/infra/db/types";
import { colleges } from "../tables";

export const findById = async (id: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const college = await client.query.colleges.findFirst({
    where: eq(colleges.id, id),
  });

  return college;
};

export const findByEmailDomain = async (emailDomain: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const college = await client.query.colleges.findFirst({
    where: eq(colleges.emailDomain, emailDomain),
  });

  return college;
};

export const findAll = async (filters?: { city?: string; state?: string }, dbTx?: DB) => {
  const client = dbTx ?? db;
  
  let whereConditions = [];
  
  if (filters?.city) {
    whereConditions.push(ilike(colleges.city, `%${filters.city}%`));
  }
  
  if (filters?.state) {
    whereConditions.push(ilike(colleges.state, `%${filters.state}%`));
  }

  const collegeList = await client.query.colleges.findMany({
    where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
    orderBy: (colleges, { asc }) => [asc(colleges.name)],
  });

  return collegeList;
};

export const create = async (college: typeof colleges.$inferInsert, dbTx?: DB) => {
  const client = dbTx ?? db;
  const createdCollege = await client
    .insert(colleges)
    .values(college)
    .returning()
    .then((r) => r?.[0] || null);

  return createdCollege;
};

export const updateById = async (id: string, updates: Partial<typeof colleges.$inferInsert>, dbTx?: DB) => {
  const client = dbTx ?? db;
  const updatedCollege = await client
    .update(colleges)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(colleges.id, id))
    .returning()
    .then((r) => r?.[0] || null);

  return updatedCollege;
};

export const deleteById = async (id: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const deletedCollege = await client
    .delete(colleges)
    .where(eq(colleges.id, id))
    .returning()
    .then((r) => r?.[0] || null);

  return deletedCollege;
};