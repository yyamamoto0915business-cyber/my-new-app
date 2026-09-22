/**
 * マイグレーション 00088 を直接 DB に適用（一緒に作るアルバム）
 *
 * 実行: npx tsx scripts/run-migration-88.ts
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
      join(process.cwd(), "supabase/migrations/00088_shared_albums.sql"),
      "utf-8",
    );
    await client.query(sql);
    const check = await client.query(
      `select to_regclass('public.shared_albums') is not null as albums,
              to_regclass('public.shared_album_members') is not null as members,
              to_regclass('public.shared_album_items') is not null as items`,
    );
    console.log("applied 00088", check.rows[0]);
  } catch (e) {
    console.error("エラー:", e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
