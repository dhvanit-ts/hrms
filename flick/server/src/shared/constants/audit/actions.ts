// -----------------------------
// 1. Shape enforcement
// -----------------------------

type ActionRegistry = {
  readonly [role: string]: {
    readonly [domain: string]: readonly string[]
  }
}

// -----------------------------
// 2. Action map (single source of truth)
// -----------------------------

export const ActionMap = {
  user: {
    post: ["upvoted", "downvoted", "created", "updated", "deleted"],
    comment: ["upvoted", "downvoted", "created", "updated", "deleted"],
    "vote:on:post": ["deleted", "switched"],
    "vote:on:comment": ["deleted", "switched"],
    content: ["reported"],
    terms: ["accepted"],
    account: ["initialized", "created"],
    self: ["logged:in", "logged:out"],
    feedback: ["created", "updated", "deleted"],
    password: ["forgot"],
    "forgot-password": ["initialized"],
  },

  auth: {
    otp: ["verify:success", "verify:failed", "send"],
  },

  admin: {
    user: ["banned", "unbanned", "suspended"],
    college: ["created", "updated", "deleted"],
    content: [
      "blocked",
      "unblocked",
      "shadow:banned",
      "shadow:unbanned",
      "banned",
      "unbanned",
      "updated",
    ],
    report: ["deleted", "updated:status"],
    reports: ["bulk-deleted"],
    feedback: ["deleted", "updated:status"],
    self: ["logged:out"],
    account: ["initialized", "verified:otp"],
    "admin:account": ["deleted", "updated"],
    "admin:accounts": ["fetched:all"],
    "authorized:device": ["removed"],
    otp: ["reset:email"],
  },

  system: {
    "admin:account": ["created"],
    log: ["error", "in", "out"],
  },

  other: {
    action: ["action"],
  },
} as const satisfies ActionRegistry

// -----------------------------
// 3. Type builder → `${role}:${action}:${domain}`
// -----------------------------

type BuildActions<T extends ActionRegistry> = {
  [R in keyof T]: {
    [D in keyof T[R]]: `${R & string}:${T[R][D][number]}:${D & string}`
  }[keyof T[R]]
}[keyof T]

// -----------------------------
// 4. Final public type
// -----------------------------

export type AuditAction = BuildActions<typeof ActionMap>

// -----------------------------
// 5. Optional runtime array (if you need it)
// -----------------------------

function buildAuditActions<T extends ActionRegistry>(
  map: T
): BuildActions<T>[] {
  return Object.entries(map).flatMap(([role, domains]) =>
    Object.entries(domains).flatMap(([domain, actions]) =>
      actions.map(action =>
        `${role}:${action}:${domain}` as BuildActions<T>
      )
    )
  )
}

export const auditActions = buildAuditActions(ActionMap)
