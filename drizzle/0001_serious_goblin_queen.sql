ALTER TABLE "skills" RENAME TO "users";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "skills_description_unique";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_description_unique" UNIQUE("description");