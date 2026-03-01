/**
 * マイグレーション 00019 を直接 DB に適用
 * Supabase CLI が別プロジェクトにリンクされている場合に使用
 *
 * 実行: node --env-file=.env.local --import tsx scripts/run-migration-19.ts
 * または: npx tsx scripts/run-migration-19.ts （.env.local を手動で読み込む）
 */
import { readFileSync } from "fs";
import { join } from "path";

// .env.local を読み込み
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
  // .env.local がなくても続行
}

import pg from "pg";

async function main() {
  const dbUrl = process.env.SUPABASE_DB_URL;
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;
  if (!dbUrl || !dbPassword) {
    console.error("SUPABASE_DB_URL と SUPABASE_DB_PASSWORD を .env.local に設定してください");
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
    console.log("DB に接続しました");

    const sqlPath = join(
      process.cwd(),
      "supabase/migrations/00019_conversations_messages.sql"
    );
    const sql = readFileSync(sqlPath, "utf-8");

    await client.query(sql);
    console.log("マイグレーション 00019 を適用しました");
  } catch (e) {
    console.error("エラー:", e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
