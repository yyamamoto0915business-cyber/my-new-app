/**
 * 募集シードスクリプト（ダミー募集3件）
 * 実行: npx tsx scripts/seed-recruitments.ts
 *
 * 注意: Supabase 接続時は Service Role Key が必要。
 * 開発時はアプリから「新規作成」で追加するか、このスクリプトを適宜変更して利用。
 */
const BASE = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : "http://localhost:3000";

async function seed() {
  const recruitments = [
    {
      title: "春のフリマ 受付スタッフ募集",
      description: "春のフリーマーケットで受付を担当していただける方を募集しています。",
      status: "public",
      start_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      end_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
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
      status: "public",
      start_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      end_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(),
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
      status: "public",
      start_at: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      end_at: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
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

  console.log("API 経由でシードを投入する場合は、ログイン後に以下を実行:");
  for (let i = 0; i < recruitments.length; i++) {
    const r = recruitments[i];
    console.log(`\n${i + 1}. ${r.title}`);
    console.log(
      `   curl -X POST ${BASE}/api/recruitments -H "Content-Type: application/json" -d '${JSON.stringify(r)}'`
    );
  }

  console.log("\nまたは、ブラウザで http://localhost:3000/organizer/recruitments/new から手動で作成してください。");
}

seed().catch(console.error);
