import { comments } from "@/infra/db/tables/comment.table";
import { commentHistory } from "@/infra/db/tables/commentHistory.table";
import { issues } from "@/infra/db/tables/issue.table";
import { issueLabels } from "@/infra/db/tables/issueLabels.table";
import { issueStatus } from "@/infra/db/tables/issueStatus.table";
import { issueStatusHistory } from "@/infra/db/tables/issueStatusHistory.table";
import { labels } from "@/infra/db/tables/label.table";
import { projects } from "@/infra/db/tables/project.table";
import { teams } from "@/infra/db/tables/team.table";
import { tenants } from "@/infra/db/tables/tenant.table";
import { userTenants } from "@/infra/db/tables/userTenants.table";
import { userTeams } from "@/infra/db/tables/userTeams.table";
import { users } from "@/infra/db/tables/user.table";

export {
  comments,
  commentHistory,
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
  users
}