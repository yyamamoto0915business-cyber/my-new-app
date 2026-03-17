/**
 * Supabase の events を全削除する（本番初期化用）
 *
 * 重要:
 * - events を削除すると、多くの関連テーブルが ON DELETE CASCADE で一緒に削除されます。
 * - 取り返しがつかないので、必ず dry-run で件数を確認してから実行してください。
 *
 * 実行例:
 *   npx tsx scripts/purge-events.ts --dry-run
 *   npx tsx scripts/purge-events.ts --apply --confirm
 *
 * 必要な環境変数（.env.local）:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync } from "fs";
import { join } from "path";
import { createAdminClient } from "@/lib/supabase/admin";

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

type RelatedCounts = {
  events: number;
  publishedEvents: number;
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
  sponsorTickets: number;
  giftCodes: number;
  reviews: number;
};

async function main() {
  const args = process.argv.slice(2);
  const isApply = args.includes("--apply");
  const isConfirm = args.includes("--confirm");
  const isDryRun = !isApply || args.includes("--dry-run");

  console.log("=== MachiGlyph PURGE events ===");
  console.log(`mode: ${isApply ? "APPLY (全削除)" : "DRY-RUN (確認のみ)"}`);

  const admin = createAdminClient();
  if (!admin) {
    console.error(
      "Supabase Admin Client を作成できませんでした。NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY を確認してください。"
    );
    process.exit(1);
  }

  const adminClient = admin;

  async function countAll(table: string, column: string = "id"): Promise<number> {
    const { count, error } = await adminClient
      .from(table)
      .select(column, { count: "exact", head: true });
    if (error) {
      console.error(`  [WARN] ${table} の件数取得に失敗しました:`, error.message);
      return 0;
    }
    return count ?? 0;
  }

  async function countPublishedEvents(): Promise<number> {
    const { count, error } = await adminClient
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("status", "published");
    if (error) {
      console.error("  [WARN] events(published) の件数取得に失敗しました:", error.message);
      return 0;
    }
    return count ?? 0;
  }

  const totals: RelatedCounts = {
    events: await countAll("events"),
    publishedEvents: await countPublishedEvents(),
    eventParticipants: await countAll("event_participants"),
    sponsorPurchases: await countAll("sponsor_purchases"),
    sponsorApplications: await countAll("sponsor_applications"),
    sponsorTiers: await countAll("sponsor_tiers"),
    eventReactions: await countAll("event_reactions"),
    recruitments: await countAll("recruitments"),
    chatRooms: await countAll("chat_rooms"),
    conversations: await countAll("conversations"),
    supportPayments: await countAll("support_payments"),
    eventOrders: await countAll("event_orders"),
    sponsorTickets: await countAll("sponsor_tickets"),
    giftCodes: await countAll("gift_codes"),
    reviews: await countAll("reviews"),
  };

  console.log("件数（全体）:");
  console.log(`  events            : ${totals.events}`);
  console.log(`  events(published) : ${totals.publishedEvents}`);
  console.log(`  event_participants: ${totals.eventParticipants}`);
  console.log(`  sponsor_purchases : ${totals.sponsorPurchases}`);
  console.log(`  sponsor_applications: ${totals.sponsorApplications}`);
  console.log(`  sponsor_tiers     : ${totals.sponsorTiers}`);
  console.log(`  event_reactions   : ${totals.eventReactions}`);
  console.log(`  recruitments      : ${totals.recruitments}`);
  console.log(`  chat_rooms        : ${totals.chatRooms}`);
  console.log(`  conversations     : ${totals.conversations}`);
  console.log(`  support_payments  : ${totals.supportPayments}`);
  console.log(`  event_orders      : ${totals.eventOrders}`);
  console.log(`  sponsor_tickets   : ${totals.sponsorTickets}`);
  console.log(`  gift_codes        : ${totals.giftCodes}`);
  console.log(`  reviews           : ${totals.reviews}`);

  if (isDryRun) {
    console.log("\nDRY-RUN のため、ここまでで終了します（削除・更新は一切行っていません）。");
    console.log("実際に全削除する場合は --apply --confirm を付けて再実行してください。");
    return;
  }

  if (!isConfirm) {
    console.error("\n[STOP] 全削除は危険なため、--apply に加えて --confirm が必須です。");
    console.error("例: npx tsx scripts/purge-events.ts --apply --confirm");
    process.exit(1);
  }

  if (totals.events === 0) {
    console.log("\nevents が 0 件のため、削除は不要です。");
    return;
  }

  console.log("\nAPPLY モードで events を全削除します...");

  // Supabase の delete は条件なしの全削除ができないため、まず ID を取得してから削除する
  const pageSize = 1000;
  let from = 0;
  const allIds: string[] = [];
  while (true) {
    const { data, error } = await adminClient
      .from("events")
      .select("id")
      .range(from, from + pageSize - 1);
    if (error) {
      console.error("events id 取得に失敗しました:", error);
      process.exit(1);
    }
    const ids = (data ?? []).map((r: any) => r.id).filter(Boolean);
    allIds.push(...ids);
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }

  console.log(`削除対象 events id 件数: ${allIds.length}`);

  // delete は in() の上限があることがあるため、チャンクで実行
  const chunkSize = 200;
  for (let i = 0; i < allIds.length; i += chunkSize) {
    const chunk = allIds.slice(i, i + chunkSize);
    const { error } = await adminClient.from("events").delete().in("id", chunk);
    if (error) {
      console.error("events 削除中にエラーが発生しました:", error);
      process.exit(1);
    }
  }

  const afterEvents = await countAll("events");
  const afterPublished = await countPublishedEvents();
  console.log(`\n削除後 events 件数: ${afterEvents}`);
  console.log(`削除後 events(published) 件数: ${afterPublished}`);
  console.log("=== PURGE 完了 ===");
}

main().catch((e) => {
  console.error("想定外のエラー:", e);
  process.exit(1);
});

