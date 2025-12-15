import { and, desc, eq, sql } from "drizzle-orm";
import db from "@/infra/db/index";
import type { DB } from "@/infra/db/types";
import { colleges } from "../tables";

export const findById = async (id: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const user = await client.query.colleges.findFirst({
    where: eq(colleges.id, id),
  });

  return user;
};

export const findByEmail = async (email: string, dbTx?: DB) => {
  const client = dbTx ?? db;
  const user = await client.query.colleges.findFirst({
    where: eq(colleges.emailDomain, email),
  });

  return user;
};

export const create = async (values: typeof colleges.$inferInsert, dbTx?: DB) => {
  const client = dbTx ?? db
  const user = await client.insert(colleges).values(values).returning().then(r => r?.[0] || null)

  return user
}
