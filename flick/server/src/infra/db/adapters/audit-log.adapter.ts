import db from ".."
import { auditLogs, AuditLogsInsert } from "../tables/audit-log.table"
import { DB } from "../types"

export const create = async (values: AuditLogsInsert, dbTx?: DB) => {
  const client = dbTx ?? db
  await client.insert(auditLogs).values(values).returning()
}
