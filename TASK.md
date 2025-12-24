Fine. Here’s a **real task**, not a toy, not a blog-demo, not “users and posts” nonsense.

## Task: Design a PostgreSQL schema for a **Multi-Tenant SaaS Issue Tracking System**

This is basically Jira-lite, but with adult problems. If you half-ass this, it’ll show immediately.

### Core idea

Multiple companies use the same system. Each company has teams, projects, issues, comments, attachments, permissions, audit logs, and billing limits. Data isolation matters. Performance matters. Future pain matters.

---

## Hard Requirements (read them, don’t skim)

### 1. Multi-tenancy

* One database, many companies.
* Every row that matters must belong to **exactly one tenant**.
* Tenants must never see each other’s data, even by accident.
* Decide: shared tables with `tenant_id` vs schema-per-tenant. Pick one and justify it.

### 2. Users & Auth (no fantasy shortcuts)

* Users can belong to **multiple tenants**.
* Different roles per tenant (admin, manager, member, viewer).
* Users can be disabled per tenant without deleting them globally.
* Soft delete only. No hard deletes. Ever.

### 3. Projects & Teams

* A tenant has many projects.
* Projects can be owned by a team.
* Users can belong to multiple teams.
* Teams can be archived.

### 4. Issues (this is where amateurs die)

Each issue must support:

* Project
* Reporter
* Assignee (nullable)
* Status (custom per tenant)
* Priority
* Labels (many-to-many)
* Parent issue (for epics/subtasks)
* SLA fields (due_at, breached_at)
* Full status history (not just current state)

### 5. Comments & Attachments

* Comments are editable, but edit history must be preserved.
* Attachments are metadata only (files live elsewhere).
* Permissions: some comments are internal-only.

### 6. Audit & Events

* Track who did what, when.
* Immutable log.
* Must support queries like:

  > “Show all changes made by user X last week across all projects in tenant Y”

### 7. Performance expectations

* List issues by project, sorted by updated time.
* Filter by assignee, status, label.
* Scale to **millions of issues** without falling apart.
* Index strategy required. Guessing is not allowed.

### 8. Constraints & Integrity

* Use foreign keys intentionally.
* Use CHECK constraints where they actually help.
* Enums vs lookup tables: choose wisely.
* Prevent impossible states at the database level.

---

## Deliverables (non-negotiable)

1. **Table list with purpose**
2. **Columns with types**
3. **Primary + foreign keys**
4. **Indexes (explicit)**
5. **Explanation of 3 hardest design decisions**
6. **One example query** that proves your schema doesn’t suck

---

## Bonus pain (optional, but telling)

* Row Level Security policy
* Partitioning strategy for issues or audit logs
* How you’d handle tenant deletion without downtime

---

This task will expose:

* Whether you understand relational modeling
* Whether you respect PostgreSQL
* Whether you think about scale before production explodes

If you want, dump your schema here and I’ll tear it apart like a proper dev buddy.
