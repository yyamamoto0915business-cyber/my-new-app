/**
 * マイグレーション 00097 を直接 DB に適用（スタンプラリーの周回）
 *
 * 実行: npx tsx scripts/run-migration-97.ts
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
      join(process.cwd(), "supabase/migrations/00097_stamp_rally_replay.sql"),
      "utf-8"
    );
    await client.query(sql);
    const check = await client.query(
      `select
         exists (
           select 1 from information_schema.columns
           where table_schema = 'public' and table_name = 'organizer_game_players' and column_name = 'play_round'
         ) as player_round,
         exists (
           select 1 from information_schema.columns
           where table_schema = 'public' and table_name = 'organizer_game_stamps' and column_name = 'round'
         ) as stamp_round`
    );
    const row = check.rows[0] as { player_round?: boolean; stamp_round?: boolean };
    console.log(row?.player_round && row?.stamp_round ? "applied 00097" : "replay columns missing");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
