CREATE TABLE "exercise" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"modality" text NOT NULL,
	"primaryMuscle" text NOT NULL,
	"equipment" text NOT NULL,
	"retiredAt" timestamp,
	CONSTRAINT "exercise_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "routine_day" (
	"id" text PRIMARY KEY NOT NULL,
	"routineId" text NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "routine_day_position_uq" UNIQUE("routineId","position")
);
--> statement-breakpoint
CREATE TABLE "routine_exercise" (
	"id" text PRIMARY KEY NOT NULL,
	"routineDayId" text NOT NULL,
	"exerciseId" text NOT NULL,
	"position" integer NOT NULL,
	"targetSets" integer NOT NULL,
	"restSeconds" integer NOT NULL,
	"repMin" integer,
	"repMax" integer,
	"note" text,
	"supersetGroup" integer,
	"alternativeExerciseId" text,
	CONSTRAINT "routine_exercise_once_per_day_uq" UNIQUE("routineDayId","exerciseId"),
	CONSTRAINT "routine_exercise_position_uq" UNIQUE("routineDayId","position")
);
--> statement-breakpoint
CREATE TABLE "routine" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"name" text NOT NULL,
	"isActive" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exercise_preference" ADD COLUMN "exerciseId" text;--> statement-breakpoint
ALTER TABLE "workout_session" ADD COLUMN "routineDayId" text;--> statement-breakpoint
ALTER TABLE "workout_session" ADD COLUMN "dayName" text;--> statement-breakpoint
ALTER TABLE "workout_set" ADD COLUMN "userId" text;--> statement-breakpoint
ALTER TABLE "workout_set" ADD COLUMN "exerciseId" text;--> statement-breakpoint
ALTER TABLE "routine_day" ADD CONSTRAINT "routine_day_routineId_routine_id_fk" FOREIGN KEY ("routineId") REFERENCES "public"."routine"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_exercise" ADD CONSTRAINT "routine_exercise_routineDayId_routine_day_id_fk" FOREIGN KEY ("routineDayId") REFERENCES "public"."routine_day"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_exercise" ADD CONSTRAINT "routine_exercise_exerciseId_exercise_id_fk" FOREIGN KEY ("exerciseId") REFERENCES "public"."exercise"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_exercise" ADD CONSTRAINT "routine_exercise_alternativeExerciseId_exercise_id_fk" FOREIGN KEY ("alternativeExerciseId") REFERENCES "public"."exercise"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine" ADD CONSTRAINT "routine_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "routine_user_idx" ON "routine" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "routine_one_active_idx" ON "routine" USING btree ("userId") WHERE "routine"."isActive";--> statement-breakpoint
ALTER TABLE "exercise_preference" ADD CONSTRAINT "exercise_preference_exerciseId_exercise_id_fk" FOREIGN KEY ("exerciseId") REFERENCES "public"."exercise"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_session" ADD CONSTRAINT "workout_session_routineDayId_routine_day_id_fk" FOREIGN KEY ("routineDayId") REFERENCES "public"."routine_day"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_set" ADD CONSTRAINT "workout_set_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_set" ADD CONSTRAINT "workout_set_exerciseId_exercise_id_fk" FOREIGN KEY ("exerciseId") REFERENCES "public"."exercise"("id") ON DELETE restrict ON UPDATE no action;