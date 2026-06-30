import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  -- We only add the clientId column and its index. 
  -- Other tables/types already exist in the database from previous dev sessions.
  DO $$ 
  BEGIN 
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workout_days' AND column_name='client_id') THEN
          ALTER TABLE "workout_days" ADD COLUMN "client_id" varchar;
      END IF;
  END $$;

  CREATE UNIQUE INDEX IF NOT EXISTS "workout_days_client_id_idx" ON "workout_days" USING btree ("client_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP INDEX IF EXISTS "workout_days_client_id_idx";
  ALTER TABLE "workout_days" DROP COLUMN IF EXISTS "client_id";
  `)
}
