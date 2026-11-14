import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import Stripe from "stripe";
import { getPosSalesSummary } from "@/lib/db/pos";
import { getStripeSecretKey } from "@/lib/stripe";
import { sweepStalePendingPointSales } from "@/lib/pos/pending-sales";

/** GET: 本日の売上サマリー＋履歴 */
export async function GET(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
  }

  const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
  if (!organizerId) {
    return NextResponse.json({ error: "主催者登録が必要です" }, { status: 403 });
  }

  const eventId = request.nextUrl.searchParams.get("eventId");

  // ポイントを預かったまま払われなかった支払い待ちを片づける（ポイントを戻す）
  const key = getStripeSecretKey();
  await sweepStalePendingPointSales(supabase, key ? new Stripe(key) : null, organizerId);

  try {
    const { summary, sales } = await getPosSalesSummary(supabase, organizerId, {
      eventId: eventId || null,
    });
    return NextResponse.json({ summary, sales });
  } catch (e) {
    console.error("pos sales GET:", e);
    return NextResponse.json({ error: "売上の取得に失敗しました" }, { status: 500 });
  }
}
