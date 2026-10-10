/**
 * マイグレーション 00096 を直接 DB に適用（スタンプラリーのポイント加算）
 *
 * 実行: npx tsx scripts/run-migration-96.ts
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
    const sql = readFileSync(
      join(process.cwd(), "supabase/migrations/00096_stamp_rally_points.sql"),
      "utf-8"
    );
    await client.query(sql);
    const check = await client.query(
      `select to_regprocedure('public.award_stamp_rally_points(uuid,uuid,integer)') is not null as fn`
    );
    console.log(check.rows[0]?.fn === true ? "applied 00096" : "award function missing");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
