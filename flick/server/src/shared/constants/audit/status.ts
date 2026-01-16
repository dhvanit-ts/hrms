export const auditStatus = ["success", "fail"] as const

export type AuditStatus = typeof auditStatus[number]