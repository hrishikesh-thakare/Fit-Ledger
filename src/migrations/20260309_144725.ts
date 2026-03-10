import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "exercises" ADD COLUMN IF NOT EXISTS "created_by_id" integer`)
  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'exercises_created_by_id_users_id_fk'
      ) THEN
        ALTER TABLE "exercises" ADD CONSTRAINT "exercises_created_by_id_users_id_fk"
          FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id")
          ON DELETE set null ON UPDATE no action;
      END IF;
    END $$
  `)
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "exercises_created_by_idx" ON "exercises" USING btree ("created_by_id")`,
  )
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "exercises" DROP CONSTRAINT "exercises_created_by_id_users_id_fk";
  
  DROP INDEX "exercises_created_by_idx";
  ALTER TABLE "exercises" DROP COLUMN "created_by_id";`)
}
