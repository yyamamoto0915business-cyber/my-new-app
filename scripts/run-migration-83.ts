/**
 * マイグレーション 00083 を直接 DB に適用（レジのカードタッチ）
 *
 * 実行: npm run pos:tap-migrate
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
    const sql = readFileSync(
      join(process.cwd(), "supabase/migrations/00083_pos_tap_payment.sql"),
      "utf-8"
    );
    await client.query(sql);
    console.log("マイグレーション 00083 を適用しました（pos_sales.payment_method に tap を追加）");
  } catch (e) {
    console.error("エラー:", e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
