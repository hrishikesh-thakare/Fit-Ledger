import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_preferred_unit" AS ENUM('kg', 'lb');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'user');
  CREATE TYPE "public"."enum_users_is_active" AS ENUM('active', 'inactive');
  CREATE TYPE "public"."enum_routines_is_active" AS ENUM('active', 'inactive');
  CREATE TYPE "public"."enum_routine_sets_set_label" AS ENUM('warmup', 'working', 'drop', 'failure');
  CREATE TYPE "public"."enum_workout_sets_set_label" AS ENUM('warmup', 'working', 'drop', 'failure');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"display_name" varchar NOT NULL,
  	"preferred_unit" "enum_users_preferred_unit" DEFAULT 'kg' NOT NULL,
  	"target_weight" numeric,
  	"role" "enum_users_role" DEFAULT 'user' NOT NULL,
  	"is_active" "enum_users_is_active" DEFAULT 'active' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "muscle_groups" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "exercises" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"muscle_group_id" integer NOT NULL,
  	"is_custom" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "routines" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"name" varchar NOT NULL,
  	"notes" varchar,
  	"is_active" "enum_routines_is_active" DEFAULT 'active' NOT NULL,
  	"exercise_count" numeric DEFAULT 0,
  	"set_count" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "routine_exercises" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"routine_id" integer NOT NULL,
  	"exercise_id" integer NOT NULL,
  	"exercise_order" numeric NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "routine_sets" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"routine_exercise_id" integer NOT NULL,
  	"set_order" numeric NOT NULL,
  	"set_label" "enum_routine_sets_set_label" NOT NULL,
  	"reps" numeric NOT NULL,
  	"weight" numeric NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "workout_days" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"routine_id" integer,
  	"user_id" integer NOT NULL,
  	"title" varchar NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"duration_seconds" numeric,
  	"volume_kg" numeric DEFAULT 0,
  	"exercise_count" numeric DEFAULT 0,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "workout_exercises" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"workout_day_id" integer NOT NULL,
  	"exercise_id" integer NOT NULL,
  	"exercise_order" numeric NOT NULL,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "workout_sets" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"workout_day_id" integer NOT NULL,
  	"workout_exercise_id" integer NOT NULL,
  	"set_order" numeric NOT NULL,
  	"set_label" "enum_workout_sets_set_label" NOT NULL,
  	"reps" numeric NOT NULL,
  	"weight" numeric NOT NULL,
  	"previous_weight" numeric,
  	"previous_reps" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "body_weight_logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"weight" numeric NOT NULL,
  	"logged_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"muscle_groups_id" integer,
  	"exercises_id" integer,
  	"routines_id" integer,
  	"routine_exercises_id" integer,
  	"routine_sets_id" integer,
  	"workout_days_id" integer,
  	"workout_exercises_id" integer,
  	"workout_sets_id" integer,
  	"body_weight_logs_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exercises" ADD CONSTRAINT "exercises_muscle_group_id_muscle_groups_id_fk" FOREIGN KEY ("muscle_group_id") REFERENCES "public"."muscle_groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "routines" ADD CONSTRAINT "routines_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercises_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "routine_exercises" ADD CONSTRAINT "routine_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "routine_sets" ADD CONSTRAINT "routine_sets_routine_exercise_id_routine_exercises_id_fk" FOREIGN KEY ("routine_exercise_id") REFERENCES "public"."routine_exercises"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workout_days" ADD CONSTRAINT "workout_days_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workout_days" ADD CONSTRAINT "workout_days_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_workout_day_id_workout_days_id_fk" FOREIGN KEY ("workout_day_id") REFERENCES "public"."workout_days"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_workout_day_id_workout_days_id_fk" FOREIGN KEY ("workout_day_id") REFERENCES "public"."workout_days"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_workout_exercise_id_workout_exercises_id_fk" FOREIGN KEY ("workout_exercise_id") REFERENCES "public"."workout_exercises"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "body_weight_logs" ADD CONSTRAINT "body_weight_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_muscle_groups_fk" FOREIGN KEY ("muscle_groups_id") REFERENCES "public"."muscle_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_exercises_fk" FOREIGN KEY ("exercises_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_routines_fk" FOREIGN KEY ("routines_id") REFERENCES "public"."routines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_routine_exercises_fk" FOREIGN KEY ("routine_exercises_id") REFERENCES "public"."routine_exercises"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_routine_sets_fk" FOREIGN KEY ("routine_sets_id") REFERENCES "public"."routine_sets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_workout_days_fk" FOREIGN KEY ("workout_days_id") REFERENCES "public"."workout_days"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_workout_exercises_fk" FOREIGN KEY ("workout_exercises_id") REFERENCES "public"."workout_exercises"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_workout_sets_fk" FOREIGN KEY ("workout_sets_id") REFERENCES "public"."workout_sets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_body_weight_logs_fk" FOREIGN KEY ("body_weight_logs_id") REFERENCES "public"."body_weight_logs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "muscle_groups_name_idx" ON "muscle_groups" USING btree ("name");
  CREATE INDEX "muscle_groups_updated_at_idx" ON "muscle_groups" USING btree ("updated_at");
  CREATE INDEX "muscle_groups_created_at_idx" ON "muscle_groups" USING btree ("created_at");
  CREATE INDEX "exercises_name_idx" ON "exercises" USING btree ("name");
  CREATE INDEX "exercises_muscle_group_idx" ON "exercises" USING btree ("muscle_group_id");
  CREATE INDEX "exercises_updated_at_idx" ON "exercises" USING btree ("updated_at");
  CREATE INDEX "exercises_created_at_idx" ON "exercises" USING btree ("created_at");
  CREATE INDEX "routines_user_idx" ON "routines" USING btree ("user_id");
  CREATE INDEX "routines_is_active_idx" ON "routines" USING btree ("is_active");
  CREATE INDEX "routines_updated_at_idx" ON "routines" USING btree ("updated_at");
  CREATE INDEX "routines_created_at_idx" ON "routines" USING btree ("created_at");
  CREATE INDEX "user_isActive_idx" ON "routines" USING btree ("user_id","is_active");
  CREATE INDEX "routine_exercises_routine_idx" ON "routine_exercises" USING btree ("routine_id");
  CREATE INDEX "routine_exercises_exercise_idx" ON "routine_exercises" USING btree ("exercise_id");
  CREATE INDEX "routine_exercises_updated_at_idx" ON "routine_exercises" USING btree ("updated_at");
  CREATE INDEX "routine_exercises_created_at_idx" ON "routine_exercises" USING btree ("created_at");
  CREATE INDEX "routine_sets_routine_exercise_idx" ON "routine_sets" USING btree ("routine_exercise_id");
  CREATE INDEX "routine_sets_updated_at_idx" ON "routine_sets" USING btree ("updated_at");
  CREATE INDEX "routine_sets_created_at_idx" ON "routine_sets" USING btree ("created_at");
  CREATE INDEX "workout_days_routine_idx" ON "workout_days" USING btree ("routine_id");
  CREATE INDEX "workout_days_user_idx" ON "workout_days" USING btree ("user_id");
  CREATE INDEX "workout_days_date_idx" ON "workout_days" USING btree ("date");
  CREATE INDEX "workout_days_updated_at_idx" ON "workout_days" USING btree ("updated_at");
  CREATE INDEX "workout_days_created_at_idx" ON "workout_days" USING btree ("created_at");
  CREATE INDEX "user_date_idx" ON "workout_days" USING btree ("user_id","date");
  CREATE INDEX "routine_date_idx" ON "workout_days" USING btree ("routine_id","date");
  CREATE INDEX "workout_exercises_workout_day_idx" ON "workout_exercises" USING btree ("workout_day_id");
  CREATE INDEX "workout_exercises_exercise_idx" ON "workout_exercises" USING btree ("exercise_id");
  CREATE INDEX "workout_exercises_updated_at_idx" ON "workout_exercises" USING btree ("updated_at");
  CREATE INDEX "workout_exercises_created_at_idx" ON "workout_exercises" USING btree ("created_at");
  CREATE INDEX "workout_sets_workout_day_idx" ON "workout_sets" USING btree ("workout_day_id");
  CREATE INDEX "workout_sets_workout_exercise_idx" ON "workout_sets" USING btree ("workout_exercise_id");
  CREATE INDEX "workout_sets_updated_at_idx" ON "workout_sets" USING btree ("updated_at");
  CREATE INDEX "workout_sets_created_at_idx" ON "workout_sets" USING btree ("created_at");
  CREATE INDEX "workoutExercise_createdAt_idx" ON "workout_sets" USING btree ("workout_exercise_id","created_at");
  CREATE INDEX "body_weight_logs_user_idx" ON "body_weight_logs" USING btree ("user_id");
  CREATE INDEX "body_weight_logs_logged_at_idx" ON "body_weight_logs" USING btree ("logged_at");
  CREATE INDEX "body_weight_logs_updated_at_idx" ON "body_weight_logs" USING btree ("updated_at");
  CREATE INDEX "body_weight_logs_created_at_idx" ON "body_weight_logs" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_muscle_groups_id_idx" ON "payload_locked_documents_rels" USING btree ("muscle_groups_id");
  CREATE INDEX "payload_locked_documents_rels_exercises_id_idx" ON "payload_locked_documents_rels" USING btree ("exercises_id");
  CREATE INDEX "payload_locked_documents_rels_routines_id_idx" ON "payload_locked_documents_rels" USING btree ("routines_id");
  CREATE INDEX "payload_locked_documents_rels_routine_exercises_id_idx" ON "payload_locked_documents_rels" USING btree ("routine_exercises_id");
  CREATE INDEX "payload_locked_documents_rels_routine_sets_id_idx" ON "payload_locked_documents_rels" USING btree ("routine_sets_id");
  CREATE INDEX "payload_locked_documents_rels_workout_days_id_idx" ON "payload_locked_documents_rels" USING btree ("workout_days_id");
  CREATE INDEX "payload_locked_documents_rels_workout_exercises_id_idx" ON "payload_locked_documents_rels" USING btree ("workout_exercises_id");
  CREATE INDEX "payload_locked_documents_rels_workout_sets_id_idx" ON "payload_locked_documents_rels" USING btree ("workout_sets_id");
  CREATE INDEX "payload_locked_documents_rels_body_weight_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("body_weight_logs_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "muscle_groups" CASCADE;
  DROP TABLE "exercises" CASCADE;
  DROP TABLE "routines" CASCADE;
  DROP TABLE "routine_exercises" CASCADE;
  DROP TABLE "routine_sets" CASCADE;
  DROP TABLE "workout_days" CASCADE;
  DROP TABLE "workout_exercises" CASCADE;
  DROP TABLE "workout_sets" CASCADE;
  DROP TABLE "body_weight_logs" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_users_preferred_unit";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_users_is_active";
  DROP TYPE "public"."enum_routines_is_active";
  DROP TYPE "public"."enum_routine_sets_set_label";
  DROP TYPE "public"."enum_workout_sets_set_label";`)
}
