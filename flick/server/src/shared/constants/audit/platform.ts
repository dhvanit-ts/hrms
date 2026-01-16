export const auditPlatforms = [
  "web",
  "mobile",
  "tv",
  "server",
  "other",
] as const

export type AuditPlatform = typeof auditPlatforms[number]