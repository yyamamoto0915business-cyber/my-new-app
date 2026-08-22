/**
 * マイグレーション 00080 を直接 DB に適用（投稿いいね・通知）
 *
 * 実行: npx tsx scripts/run-migration-80.ts
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

async function main() {
  const dbUrl = process.env.SUPABASE_DB_URL;
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;
  if (!dbUrl || !dbPassword) {
    console.error(
      "SUPABASE_DB_URL と SUPABASE_DB_PASSWORD を .env.local に設定してください",
    );
    process.exit(1);
  }

  const url = new URL(dbUrl.replace(/^postgres(ql)?:\/\//, "https://"));
  const client = new pg.Client({
    host: url.hostname,
    port: parseInt(url.port || "6543", 10),
    user: url.username || "postgres",
    password: dbPassword,
    database: url.pathname.slice(1) || "postgres",
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const sql = readFileSync(
      join(process.cwd(), "supabase/migrations/00080_community_post_likes.sql"),
      "utf-8",
    );
    await client.query(sql);
    console.log("マイグレーション 00080 を適用しました");
  } catch (e) {
    console.error("エラー:", e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
