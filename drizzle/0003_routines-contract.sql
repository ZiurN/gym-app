DROP INDEX "workout_session_user_status_idx";--> statement-breakpoint
DROP INDEX "workout_session_user_day_idx";--> statement-breakpoint
DROP INDEX "workout_set_exercise_idx";--> statement-breakpoint
ALTER TABLE "exercise_preference" DROP CONSTRAINT "exercise_preference_userId_exerciseKey_pk";--> statement-breakpoint
ALTER TABLE "exercise_preference" ALTER COLUMN "exerciseId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "workout_session" ALTER COLUMN "dayName" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "workout_set" ALTER COLUMN "userId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "workout_set" ALTER COLUMN "exerciseId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "exercise_preference" ADD CONSTRAINT "exercise_preference_userId_exerciseId_pk" PRIMARY KEY("userId","exerciseId");--> statement-breakpoint
CREATE INDEX "workout_session_user_status_completed_idx" ON "workout_session" USING btree ("userId","status","completedAt");--> statement-breakpoint
CREATE UNIQUE INDEX "workout_session_one_in_progress_idx" ON "workout_session" USING btree ("userId") WHERE "workout_session"."status" = 'in_progress';--> statement-breakpoint
CREATE INDEX "workout_set_user_exercise_idx" ON "workout_set" USING btree ("userId","exerciseId","completedAt");--> statement-breakpoint
ALTER TABLE "exercise_preference" DROP COLUMN "exerciseKey";--> statement-breakpoint
ALTER TABLE "workout_session" DROP COLUMN "dayKey";--> statement-breakpoint
ALTER TABLE "workout_set" DROP COLUMN "exerciseKey";--> statement-breakpoint
ALTER TABLE "workout_set" ADD CONSTRAINT "workout_set_slot_uq" UNIQUE NULLS NOT DISTINCT("sessionId","exerciseId","setIndex","side");