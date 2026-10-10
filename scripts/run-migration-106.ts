/**
 * マイグレーション 00106 を直接 DB に適用（フォトラリーのポイント加算）
 *
 * 実行: npx tsx scripts/run-migration-106.ts
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
    const sql = readFileSync(join(process.cwd(), "supabase/migrations/00106_photo_play_points.sql"), "utf-8");
    await client.query(sql);
    const check = await client.query(
      `select to_regprocedure('public.award_play_points(uuid,uuid,integer,text)') is not null as ready`,
    );
    console.log(check.rows[0]?.ready ? "applied 00106" : "missing award_play_points");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "migration failed");
  process.exit(1);
});
