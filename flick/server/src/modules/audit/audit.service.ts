import { AuditLogsInsert } from "@/infra/db/tables/audit-log.table";
import AuditLogRepo from "./audit.repo";

class AuditService {
  static async writeLog(logData: AuditLogsInsert) {
    await AuditLogRepo.Write.create(logData)
  }
}

export default AuditService