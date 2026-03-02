/**
 * 募集シードを DB に直接投入
 * 主催者（organizers）が1件以上存在する必要あり
 *
 * 実行: npx tsx scripts/seed-recruitments-db.ts
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

const SEED_RECRUITMENTS = [
  {
    title: "春のフリマ 受付スタッフ募集",
    description: "春のフリーマーケットで受付を担当していただける方を募集しています。",
    start_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    end_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
    meeting_place: "〇〇公民館 正面玄関前",
    meeting_lat: 35.6812,
    meeting_lng: 139.7671,
    roles: [{ name: "受付", count: 2 }, { name: "誘導", count: 1 }],
    capacity: 5,
    items_to_bring: "動きやすい服、飲み物、タオル",
    provisions: "昼食支給",
    notes: "雨天時は屋内で開催",
  },
  {
    title: "地域イベント 物販スタッフ",
    description: "地域のお祭りで物販ブースの運営をお手伝いいただける方を募集します。",
    start_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    end_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
    meeting_place: "△△公園 東口集合",
    meeting_lat: 35.6912,
    meeting_lng: 139.7771,
    roles: [{ name: "物販", count: 2 }, { name: "レジ", count: 1 }],
    capacity: 3,
    items_to_bring: "エプロン（あれば）",
    provisions: "交通費実費支給",
    notes: "混雑時は立つことが多いです",
  },
  {
    title: "ワークショップ 設営・撤収スタッフ",
    description: "子ども向けワークショップの設営と撤収をお手伝いいただける方を募集します。",
    start_at: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    end_at: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
    meeting_place: "□□区民センター 1Fロビー",
    meeting_lat: 35.6712,
    meeting_lng: 139.7571,
    roles: [{ name: "設営", count: 2 }, { name: "撤収", count: 2 }],
    capacity: 4,
    items_to_bring: "作業しやすい服",
    provisions: "軽食支給",
    notes: "重い物を運ぶ作業があります",
  },
];

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

    const orgRes = await client.query("SELECT id FROM public.organizers LIMIT 1");
    if (orgRes.rows.length === 0) {
      console.warn("主催者（organizers）が1件もありません。主催者登録後に再実行してください。");
      process.exit(0);
    }
    const organizerId = orgRes.rows[0].id;
    console.log("主催者ID:", organizerId);

    const countRes = await client.query("SELECT COUNT(*) AS n FROM public.recruitments");
    if (Number(countRes.rows[0]?.n ?? 0) > 0) {
      console.log("既に募集が存在します。スキップします。");
      process.exit(0);
    }

    for (const r of SEED_RECRUITMENTS) {
      await client.query(
        `INSERT INTO public.recruitments (
          organizer_id, type, title, description, status,
          start_at, end_at, meeting_place, meeting_lat, meeting_lng,
          roles, capacity, items_to_bring, provisions, notes
        ) VALUES ($1, 'volunteer', $2, $3, 'public', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          organizerId,
          r.title,
          r.description,
          r.start_at.toISOString(),
          r.end_at.toISOString(),
          r.meeting_place,
          r.meeting_lat,
          r.meeting_lng,
          JSON.stringify(r.roles),
          r.capacity,
          r.items_to_bring,
          r.provisions,
          r.notes,
        ]
      );
      console.log("追加:", r.title);
    }
    console.log("募集シード投入完了");
  } catch (e) {
    console.error("エラー:", e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
