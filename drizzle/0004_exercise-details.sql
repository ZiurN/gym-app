CREATE TABLE "exercise_instruction" (
	"exerciseId" text NOT NULL,
	"locale" text NOT NULL,
	"steps" text[] NOT NULL,
	CONSTRAINT "exercise_instruction_exerciseId_locale_pk" PRIMARY KEY("exerciseId","locale")
);
--> statement-breakpoint
ALTER TABLE "exercise" ADD COLUMN "sourceId" text;--> statement-breakpoint
ALTER TABLE "exercise" ADD COLUMN "targetMuscle" text;--> statement-breakpoint
ALTER TABLE "exercise" ADD COLUMN "secondaryMuscles" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "exercise" ADD COLUMN "equipmentDetail" text;--> statement-breakpoint
ALTER TABLE "exercise" ADD COLUMN "hasPhotos" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "exercise_instruction" ADD CONSTRAINT "exercise_instruction_exerciseId_exercise_id_fk" FOREIGN KEY ("exerciseId") REFERENCES "public"."exercise"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise" ADD CONSTRAINT "exercise_sourceId_unique" UNIQUE("sourceId");