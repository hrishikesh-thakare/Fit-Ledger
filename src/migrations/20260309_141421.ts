import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "exercises_equipment" CASCADE;
  ALTER TABLE "exercises" ADD COLUMN IF NOT EXISTS "equipment" "enum_exercises_equipment";
  ALTER TABLE "body_weight_logs" ADD COLUMN IF NOT EXISTS "client_id" varchar;
  CREATE UNIQUE INDEX IF NOT EXISTS "body_weight_logs_client_id_idx" ON "body_weight_logs" USING btree ("client_id");`)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "exercises_equipment" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_exercises_equipment",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  DROP INDEX "body_weight_logs_client_id_idx";
  ALTER TABLE "exercises_equipment" ADD CONSTRAINT "exercises_equipment_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "exercises_equipment_order_idx" ON "exercises_equipment" USING btree ("order");
  CREATE INDEX "exercises_equipment_parent_idx" ON "exercises_equipment" USING btree ("parent_id");
  ALTER TABLE "exercises" DROP COLUMN "equipment";
  ALTER TABLE "body_weight_logs" DROP COLUMN "client_id";`)
}
