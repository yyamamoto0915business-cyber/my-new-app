/**
 * 本番 DB からテンプレ / サンプル / シード由来のイベントを整理するスクリプト
 *
 * 実行例:
 *   npx tsx scripts/cleanup-sample-events.ts --dry-run   # 影響範囲だけ確認（デフォルト）
 *   npx tsx scripts/cleanup-sample-events.ts --apply     # 実際に削除
 *
 * ※ .env.local に NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が必要です
 */

import { readFileSync } from "fs";
import { join } from "path";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSampleLikeEventRow } from "@/lib/sample-events";

// .env.local を読み込み（他のスクリプトと揃える）
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

async function main() {
  const args = process.argv.slice(2);
  const isApply = args.includes("--apply");
  const isDryRun = !isApply || args.includes("--dry-run");

  console.log("=== MachiGlyph Sample Events Cleanup ===");
  console.log(`mode: ${isApply ? "APPLY (実削除)" : "DRY-RUN (確認のみ)"}`);

  const admin = createAdminClient();
  if (!admin) {
    console.error("Supabase Admin Client を作成できませんでした。NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY を確認してください。");
    process.exit(1);
  }

  // 1. 現在の公開イベント件数
  const { count: beforePublicCount } = await admin
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  console.log(`現在の公開イベント件数 (status='published'): ${beforePublicCount ?? 0}`);

  // 2. 全イベントからサンプルっぽいものを抽出
  const { data: allEvents, error } = await admin
    .from("events")
    .select("*");

  if (error || !allEvents) {
    console.error("events テーブルの取得に失敗しました:", error);
    process.exit(1);
  }

  const sampleEvents = allEvents.filter((row) => isSampleLikeEventRow(row as any));

  if (sampleEvents.length === 0) {
    console.log("サンプル/テンプレと判定されたイベントはありませんでした。");
    return;
  }

  console.log(`サンプル/テンプレ候補イベント数: ${sampleEvents.length}`);

  // 関連テーブルの件数をまとめて取得
  type RelatedCounts = {
    eventParticipants: number;
    sponsorPurchases: number;
    sponsorApplications: number;
    sponsorTiers: number;
    eventReactions: number;
    recruitments: number;
    chatRooms: number;
    conversations: number;
    supportPayments: number;
    eventOrders: number;
  };

  const totals: RelatedCounts = {
    eventParticipants: 0,
    sponsorPurchases: 0,
    sponsorApplications: 0,
    sponsorTiers: 0,
    eventReactions: 0,
    recruitments: 0,
    chatRooms: 0,
    conversations: 0,
    supportPayments: 0,
    eventOrders: 0,
  };

  const eventIds = sampleEvents.map((e) => e.id);

  async function count(table: string): Promise<number> {
    const { count, error: cError } = await admin
      .from(table)
      .select("id", { count: "exact", head: true })
      .in("event_id", eventIds);
    if (cError) {
      console.error(`  [WARN] ${table} の件数取得に失敗しました:`, cError.message);
      return 0;
    }
    return count ?? 0;
  }

  totals.eventParticipants = await count("event_participants");
  totals.sponsorPurchases = await count("sponsor_purchases");
  totals.sponsorApplications = await count("sponsor_applications");
  totals.sponsorTiers = await count("sponsor_tiers");
  totals.eventReactions = await count("event_reactions");
  totals.recruitments = await count("recruitments");
  totals.chatRooms = await count("chat_rooms");
  totals.conversations = await count("conversations");
  totals.supportPayments = await count("support_payments");
  totals.eventOrders = await count("event_orders");

  console.log("関連レコードの件数（サンプルイベントに紐づくもの）:");
  console.log(`  event_participants: ${totals.eventParticipants}`);
  console.log(`  sponsor_purchases : ${totals.sponsorPurchases}`);
  console.log(`  sponsor_applications: ${totals.sponsorApplications}`);
  console.log(`  sponsor_tiers     : ${totals.sponsorTiers}`);
  console.log(`  event_reactions  : ${totals.eventReactions}`);
  console.log(`  recruitments     : ${totals.recruitments}`);
  console.log(`  chat_rooms       : ${totals.chatRooms}`);
  console.log(`  conversations    : ${totals.conversations}`);
  console.log(`  support_payments : ${totals.supportPayments}`);
  console.log(`  event_orders     : ${totals.eventOrders}`);

  if (isDryRun) {
    console.log("\nDRY-RUN のため、ここまでで終了します（削除・更新は一切行っていません）。");
    console.log("実際に削除する場合は --apply を付けて再実行してください。");
    return;
  }

  console.log("\nAPPLY モードでサンプルイベントを削除します...");

  const { error: deleteError } = await admin
    .from("events")
    .delete()
    .in("id", eventIds);

  if (deleteError) {
    console.error("events 削除中にエラーが発生しました:", deleteError);
    process.exit(1);
  }

  console.log(`events から ${sampleEvents.length} 件のサンプルイベントを削除しました。`);

  const { count: afterPublicCount } = await admin
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  console.log(`\n削除後の公開イベント件数 (status='published'): ${afterPublicCount ?? 0}`);
  console.log("=== Cleanup 完了 ===");
}

main().catch((e) => {
  console.error("想定外のエラー:", e);
  process.exit(1);
});

