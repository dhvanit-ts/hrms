import { env } from "@/config/env";
import { commentHistory, comments, issueLabels, issueStatus, issueStatusHistory, issues, labels, projects, teams, tenants, userTeams, userTenants, users } from "@/infra/db/tables";

import { drizzle } from 'drizzle-orm/node-postgres';

const db = drizzle(env.DATABASE_URL, {
  schema: {
    users,
    commentHistory,
    comments,
    issueLabels,
    issueStatus,
    issueStatusHistory,
    issues,
    labels,
    projects,
    teams,
    tenants,
    userTeams,
    userTenants,
  },
});

export default db;