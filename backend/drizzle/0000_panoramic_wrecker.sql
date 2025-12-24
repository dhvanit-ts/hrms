CREATE TYPE "public"."role" AS ENUM('user', 'admin', 'superadmin');--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"content" text,
	"issue_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"is_deleted" boolean DEFAULT false,
	"visibility" text,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "comment-history" (
	"id" uuid PRIMARY KEY NOT NULL,
	"commentId" uuid NOT NULL,
	"from_content" text NOT NULL,
	"to_content" text NOT NULL,
	"changed_id" uuid NOT NULL,
	"changed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "issue-labels" (
	"id" uuid PRIMARY KEY NOT NULL,
	"issueId" uuid NOT NULL,
	"leblId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issue-status" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"position" integer NOT NULL,
	"is_terminal" boolean DEFAULT false,
	"is_active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp NOT NULL,
	"deletedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issue_status_history" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"issue_id" uuid NOT NULL,
	"from_status" uuid NOT NULL,
	"to_status" uuid NOT NULL,
	"changed_id" uuid NOT NULL,
	"changed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "issue" (
	"id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"reporter_id" uuid NOT NULL,
	"assginee_id" uuid,
	"status" uuid NOT NULL,
	"priority" "priority_enum" DEFAULT 'medium',
	"parent_issue" uuid,
	"due_at" timestamp,
	"breached_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "label" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"tenant_id" uuid NOT NULL,
	"owned_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"is_archived" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "tenant" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text,
	"domain" text
);
--> statement-breakpoint
CREATE TABLE "user_teams" (
	"id" uuid PRIMARY KEY NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_tenants" (
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"roles" "role"[] DEFAULT '{"user"}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text,
	"authType" "authType" DEFAULT 'manual' NOT NULL,
	"refreshToken" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_issue_id_issue_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issue"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment-history" ADD CONSTRAINT "comment-history_commentId_comments_id_fk" FOREIGN KEY ("commentId") REFERENCES "public"."comments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment-history" ADD CONSTRAINT "comment-history_changed_id_user_id_fk" FOREIGN KEY ("changed_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue-labels" ADD CONSTRAINT "issue-labels_issueId_issue_id_fk" FOREIGN KEY ("issueId") REFERENCES "public"."issue"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue-labels" ADD CONSTRAINT "issue-labels_leblId_label_id_fk" FOREIGN KEY ("leblId") REFERENCES "public"."label"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue-status" ADD CONSTRAINT "issue-status_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_status_history" ADD CONSTRAINT "issue_status_history_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_status_history" ADD CONSTRAINT "issue_status_history_issue_id_issue_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issue"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_status_history" ADD CONSTRAINT "issue_status_history_from_status_issue-status_id_fk" FOREIGN KEY ("from_status") REFERENCES "public"."issue-status"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_status_history" ADD CONSTRAINT "issue_status_history_to_status_issue-status_id_fk" FOREIGN KEY ("to_status") REFERENCES "public"."issue-status"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_status_history" ADD CONSTRAINT "issue_status_history_changed_id_user_id_fk" FOREIGN KEY ("changed_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue" ADD CONSTRAINT "issue_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue" ADD CONSTRAINT "issue_reporter_id_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue" ADD CONSTRAINT "issue_assginee_id_user_id_fk" FOREIGN KEY ("assginee_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue" ADD CONSTRAINT "issue_status_issue-status_id_fk" FOREIGN KEY ("status") REFERENCES "public"."issue-status"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue" ADD CONSTRAINT "issue_parent_issue_issue_id_fk" FOREIGN KEY ("parent_issue") REFERENCES "public"."issue"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owned_by_team_id_fk" FOREIGN KEY ("owned_by") REFERENCES "public"."team"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_teams" ADD CONSTRAINT "user_teams_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_teams" ADD CONSTRAINT "user_teams_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tenants" ADD CONSTRAINT "user_tenants_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tenants" ADD CONSTRAINT "user_tenants_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "issue_statuses_tenant_name_unique" ON "issue-status" USING btree ("tenant_id","name");