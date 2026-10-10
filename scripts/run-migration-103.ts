/**
 * マイグレーション 00103 を直接 DB に適用（クーポンラリーの記録）
 *
 * 実行: npx tsx scripts/run-migration-103.ts
 */
import { readFileSync } from "fs";
import { join } from "path";

try {
  const envPath = join(process.cwd(), ".env.local");
  const env = readFileSync(envPath, "utf-8");
  for (const line of env.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch {
  /* .env.local がなくても続行 */
}

import pg from "pg";
import { getDirectPostgresClientConfig } from "../lib/direct-postgres-config";

async function main() {
  const client = new pg.Client(getDirectPostgresClientConfig());
  try {
    await client.connect();
    const sql = readFileSync(join(process.cwd(), "supabase/migrations/00103_coupon_play_progress.sql"), "utf-8");
    await client.query(sql);
    const check = await client.query(
      `select exists (
         select 1 from information_schema.columns
         where table_schema = 'public'
           and table_name = 'organizer_game_players'
           and column_name = 'coupon_done'
       ) as ready`,
    );
    console.log(check.rows[0]?.ready ? "applied 00103" : "missing coupon_done");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "migration failed");
  process.exit(1);
});
