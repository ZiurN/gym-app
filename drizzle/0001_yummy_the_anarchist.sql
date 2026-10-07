CREATE TABLE "exercise_preference" (
	"userId" text NOT NULL,
	"exerciseKey" text NOT NULL,
	"weightUnit" text DEFAULT 'kg' NOT NULL,
	CONSTRAINT "exercise_preference_userId_exerciseKey_pk" PRIMARY KEY("userId","exerciseKey")
);
--> statement-breakpoint
CREATE TABLE "workout_session" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"dayKey" text NOT NULL,
	"status" text NOT NULL,
	"startedAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "workout_set" (
	"id" text PRIMARY KEY NOT NULL,
	"sessionId" text NOT NULL,
	"exerciseKey" text NOT NULL,
	"setIndex" integer NOT NULL,
	"modality" text NOT NULL,
	"load" real,
	"weightUnit" text,
	"reps" integer,
	"durationSec" integer,
	"side" text,
	"completedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exercise_preference" ADD CONSTRAINT "exercise_preference_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_session" ADD CONSTRAINT "workout_session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_set" ADD CONSTRAINT "workout_set_sessionId_workout_session_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."workout_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workout_session_user_status_idx" ON "workout_session" USING btree ("userId","status");--> statement-breakpoint
CREATE INDEX "workout_session_user_day_idx" ON "workout_session" USING btree ("userId","dayKey");--> statement-breakpoint
CREATE INDEX "workout_set_session_idx" ON "workout_set" USING btree ("sessionId");--> statement-breakpoint
CREATE INDEX "workout_set_exercise_idx" ON "workout_set" USING btree ("exerciseKey");