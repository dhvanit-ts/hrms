import * as authRepo from "@/infra/db/adapters/audit-log.adapter"

const AuditLogRepo = {
  Write: {
    create: authRepo.create
  }
}

export default AuditLogRepo
