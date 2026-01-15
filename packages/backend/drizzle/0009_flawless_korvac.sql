ALTER TABLE "project_versions" DROP CONSTRAINT "project_versions_created_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "project_versions" ADD CONSTRAINT "project_versions_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;