export const auditEntityTypes = [
  "post",
  "comment",
  "bookmark",
  "college",
  "content-report",
  "feedback",
  "notification",
  "user",
  "auth",
  "vote",
  "system",
  "device",
  "otp",
  "account"
] as const

export type AuditEntity = typeof auditEntityTypes[number]
