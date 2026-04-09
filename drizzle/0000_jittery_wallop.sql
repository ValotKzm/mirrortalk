CREATE TABLE "skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	CONSTRAINT "skills_description_unique" UNIQUE("description")
);
