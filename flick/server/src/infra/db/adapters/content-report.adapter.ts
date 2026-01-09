import prisma from "@/infra/db/index"
import { DBTx } from "../types"
import { ContentReportInsert, contentReports, ContentReportSelect } from "../tables/content-report.table"
import { eq, and, inArray, sql, desc, asc } from "drizzle-orm"

export const create = async (values: ContentReportInsert, db?: DBTx) => {
  const client = db ?? prisma
  const [report] = await client.insert(contentReports).values(values).returning()
  return report
};

export const findById = async (id: string, db?: DBTx): Promise<ContentReportSelect | null> => {
  const client = db ?? prisma
  const [report] = await client.select().from(contentReports).where(eq(contentReports.id, id))
  return report || null
};

export const findByUserId = async (userId: number, db?: DBTx): Promise<ContentReportSelect[]> => {
  const client = db ?? prisma
  return await client.select().from(contentReports).where(eq(contentReports.reportedBy, userId))
};

export const findAll = async (db?: DBTx): Promise<ContentReportSelect[]> => {
  const client = db ?? prisma
  return await client.select().from(contentReports)
};

export const findWithFilters = async (
  filters: {
    type?: "Post" | "Comment" | "Both";
    statuses?: string[];
    page?: number;
    limit?: number;
  },
  db?: DBTx
) => {
  const client = db ?? prisma
  const { type, statuses = ["pending"], page = 1, limit = 10 } = filters
  const offset = (page - 1) * limit

  let whereConditions = []

  if (type && type !== "Both") {
    whereConditions.push(eq(contentReports.type, type))
  }

  if (statuses.length > 0) {
    whereConditions.push(inArray(contentReports.status, statuses))
  }

  const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

  const reports = await client
    .select()
    .from(contentReports)
    .where(whereClause)
    .orderBy(desc(contentReports.createdAt))
    .limit(limit)
    .offset(offset)

  const [{ count }] = await client
    .select({ count: sql<number>`count(*)` })
    .from(contentReports)
    .where(whereClause)

  return { reports, totalCount: count }
};

export const findByTargetId = async (
  targetId: number,
  type: "Post" | "Comment",
  db?: DBTx
): Promise<ContentReportSelect[]> => {
  const client = db ?? prisma
  const whereCondition = type === "Post"
    ? and(eq(contentReports.postId, targetId), eq(contentReports.type, "Post"))
    : and(eq(contentReports.commentId, targetId), eq(contentReports.type, "Comment"))

  return await client.select().from(contentReports).where(whereCondition)
};

export const updateStatus = async (id: string, status: string, db?: DBTx): Promise<ContentReportSelect | null> => {
  const client = db ?? prisma
  const [report] = await client
    .update(contentReports)
    .set({ status, updatedAt: new Date() })
    .where(eq(contentReports.id, id))
    .returning()
  return report || null
};

export const updateManyByTargetId = async (
  targetId: number,
  type: "Post" | "Comment",
  status: string,
  db?: DBTx
): Promise<ContentReportSelect[]> => {
  const client = db ?? prisma
  const whereCondition = type === "Post"
    ? and(eq(contentReports.postId, targetId), eq(contentReports.type, "Post"))
    : and(eq(contentReports.commentId, targetId), eq(contentReports.type, "Comment"))

  return await client
    .update(contentReports)
    .set({ status, updatedAt: new Date() })
    .where(whereCondition)
    .returning()
};

export const deleteById = async (id: string, db?: DBTx): Promise<boolean> => {
  const client = db ?? prisma
  const result = await client.delete(contentReports).where(eq(contentReports.id, id))
  return result.rowCount > 0
};

export const deleteManyByIds = async (ids: string[], db?: DBTx): Promise<number> => {
  const client = db ?? prisma
  const result = await client.delete(contentReports).where(inArray(contentReports.id, ids))
  return result.rowCount
};