import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

export const authenticators = pgTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => [
    primaryKey({ columns: [authenticator.userId, authenticator.credentialID] }),
  ],
);

export const exercises = pgTable("exercise", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  modality: text("modality")
    .$type<"load_reps" | "time" | "per_side">()
    .notNull(),
  // Groups used for filtering; the specific values are for display.
  primaryMuscle: text("primaryMuscle").notNull(),
  equipment: text("equipment").notNull(),
  /** Id in the dataset the catalog is imported from; see docs/CATALOG.md. */
  sourceId: text("sourceId").unique(),
  targetMuscle: text("targetMuscle"),
  secondaryMuscles: text("secondaryMuscles")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  equipmentDetail: text("equipmentDetail"),
  hasPhotos: boolean("hasPhotos").notNull().default(false),
  retiredAt: timestamp("retiredAt", { mode: "date" }),
});

/** Execution steps per language, kept apart so catalog lists never read them. */
export const exerciseInstructions = pgTable(
  "exercise_instruction",
  {
    exerciseId: text("exerciseId")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    steps: text("steps").array().notNull(),
  },
  (table) => [primaryKey({ columns: [table.exerciseId, table.locale] })],
);

export const routines = pgTable(
  "routine",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    isActive: boolean("isActive").notNull().default(false),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("routine_user_idx").on(table.userId),
    uniqueIndex("routine_one_active_idx")
      .on(table.userId)
      .where(sql`${table.isActive}`),
  ],
);

export const routineDays = pgTable(
  "routine_day",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    routineId: text("routineId")
      .notNull()
      .references(() => routines.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: integer("position").notNull(),
  },
  (table) => [
    unique("routine_day_position_uq").on(table.routineId, table.position),
  ],
);

export const routineExercises = pgTable(
  "routine_exercise",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    routineDayId: text("routineDayId")
      .notNull()
      .references(() => routineDays.id, { onDelete: "cascade" }),
    exerciseId: text("exerciseId")
      .notNull()
      .references(() => exercises.id, { onDelete: "restrict" }),
    position: integer("position").notNull(),
    targetSets: integer("targetSets").notNull(),
    restSeconds: integer("restSeconds").notNull(),
    repMin: integer("repMin"),
    repMax: integer("repMax"),
    note: text("note"),
    supersetGroup: integer("supersetGroup"),
    alternativeExerciseId: text("alternativeExerciseId").references(
      () => exercises.id,
      { onDelete: "restrict" },
    ),
  },
  (table) => [
    unique("routine_exercise_once_per_day_uq").on(
      table.routineDayId,
      table.exerciseId,
    ),
    unique("routine_exercise_position_uq").on(
      table.routineDayId,
      table.position,
    ),
  ],
);

export const workoutSessions = pgTable(
  "workout_session",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Soft link: history must survive the routine being edited or deleted.
    routineDayId: text("routineDayId").references(() => routineDays.id, {
      onDelete: "set null",
    }),
    dayName: text("dayName").notNull(),
    status: text("status").$type<"in_progress" | "completed">().notNull(),
    startedAt: timestamp("startedAt", { mode: "date" }).notNull().defaultNow(),
    completedAt: timestamp("completedAt", { mode: "date" }),
  },
  (table) => [
    index("workout_session_user_status_completed_idx").on(
      table.userId,
      table.status,
      table.completedAt,
    ),
    uniqueIndex("workout_session_one_in_progress_idx")
      .on(table.userId)
      .where(sql`${table.status} = 'in_progress'`),
  ],
);

export const workoutSets = pgTable(
  "workout_set",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: text("sessionId")
      .notNull()
      .references(() => workoutSessions.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    exerciseId: text("exerciseId")
      .notNull()
      .references(() => exercises.id, { onDelete: "restrict" }),
    setIndex: integer("setIndex").notNull(),
    modality: text("modality")
      .$type<"load_reps" | "time" | "per_side">()
      .notNull(),
    load: real("load"),
    weightUnit: text("weightUnit").$type<"kg" | "lb">(),
    reps: integer("reps"),
    durationSec: integer("durationSec"),
    side: text("side").$type<"left" | "right">(),
    completedAt: timestamp("completedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("workout_set_session_idx").on(table.sessionId),
    index("workout_set_user_exercise_idx").on(
      table.userId,
      table.exerciseId,
      table.completedAt,
    ),
    unique("workout_set_slot_uq")
      .on(table.sessionId, table.exerciseId, table.setIndex, table.side)
      .nullsNotDistinct(),
  ],
);

export const exercisePreferences = pgTable(
  "exercise_preference",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    exerciseId: text("exerciseId")
      .notNull()
      .references(() => exercises.id, { onDelete: "restrict" }),
    weightUnit: text("weightUnit").$type<"kg" | "lb">().notNull().default("kg"),
  },
  (table) => [primaryKey({ columns: [table.userId, table.exerciseId] })],
);
