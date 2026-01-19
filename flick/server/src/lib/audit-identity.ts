import crypto from "node:crypto"

function maskEmail(email: string) {
  const atIndex = email.indexOf("@")
  if (atIndex <= 1) return "***@***"

  const name = email.slice(0, atIndex)
  const domain = email.slice(atIndex + 1)

  return (
    name[0] +
    "*".repeat(Math.min(3, name.length - 1)) +
    "@" +
    domain
  )
}

function auditIdentity(email: string) {
  return {
    masked: maskEmail(email),
    hash: crypto
      .createHash("sha256")
      .update(email.toLowerCase())
      .digest("hex")
      .slice(0, 12),
  }
}


export { maskEmail, auditIdentity }