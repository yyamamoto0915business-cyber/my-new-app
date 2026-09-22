/**
 * マイグレーション 00085 / 00086 を直接 DB に適用（主催者ゲーム機能）
 *
 * 実行: npx tsx scripts/run-migration-85-86.ts
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
  let config;
  try {
    config = getDirectPostgresClientConfig();
  } catch {
    console.error("SUPABASE_DB_URL（または DATABASE_URL）を .env.local に設定してください");
    process.exit(1);
  }

  const client = new pg.Client(config);

  try {
    await client.connect();
    const existing = await client.query<{ exists: boolean }>(
      `select to_regclass('public.organizer_games') is not null as exists`
    );
    console.log("organizer_games exists:", existing.rows[0]?.exists);

    for (const file of [
      "supabase/migrations/00085_organizer_games.sql",
      "supabase/migrations/00086_organizer_game_spots.sql",
    ]) {
      const sql = readFileSync(join(process.cwd(), file), "utf-8");
      await client.query(sql);
      console.log("applied", file);
    }

    await client.query("notify pgrst, 'reload schema'");
    const spots = await client.query<{ exists: boolean }>(
      `select to_regclass('public.organizer_game_spots') is not null as exists`
    );
    console.log("organizer_game_spots exists:", spots.rows[0]?.exists);
  } catch (e) {
    console.error("エラー:", e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
