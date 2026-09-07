import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getApiUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { getPosSaleById } from "@/lib/db/pos";
import { getStripeSecretKey } from "@/lib/stripe";
import { getStripeTerminalLocationId } from "@/lib/pos/tap-app";

/** GET: iPhoneタッチアプリが会計1件の PaymentIntent を取る */
export async function GET(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const supabase = createAdminClient() ?? (await createClient());
  if (!supabase) {
    return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
  }

  const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
  if (!organizerId) {
    return NextResponse.json({ error: "主催者登録が必要です" }, { status: 403 });
  }

  const saleId = request.nextUrl.searchParams.get("saleId")?.trim();
  if (!saleId) {
    return NextResponse.json({ error: "saleId は必須です" }, { status: 400 });
  }

  const locationId = getStripeTerminalLocationId();
  if (!locationId) {
    return NextResponse.json(
      { error: "カードタッチの店舗設定がありません" },
      { status: 503 }
    );
  }

  const stripeKey = getStripeSecretKey();
  if (!stripeKey) {
    return NextResponse.json({ error: "決済は現在利用できません" }, { status: 503 });
  }

  const { data: organizer } = await supabase
    .from("organizers")
    .select("stripe_account_id")
    .eq("id", organizerId)
    .single();

  if (!organizer?.stripe_account_id) {
    return NextResponse.json({ error: "売上受取設定が完了していません" }, { status: 400 });
  }

  let sale;
  try {
    sale = await getPosSaleById(supabase, organizerId, saleId);
  } catch (e) {
    console.error("pos terminal session:", e);
    return NextResponse.json({ error: "会計の取得に失敗しました" }, { status: 500 });
  }

  if (!sale) {
    return NextResponse.json({ error: "会計が見つかりません" }, { status: 404 });
  }
  if (sale.paymentMethod !== "tap") {
    return NextResponse.json({ error: "この会計はカードタッチではありません" }, { status: 400 });
  }
  if (sale.status === "paid") {
    return NextResponse.json({ sale, alreadyPaid: true });
  }
  if (sale.status !== "pending" || !sale.stripePaymentIntentId) {
    return NextResponse.json({ error: "この会計はタッチ決済できません" }, { status: 400 });
  }

  try {
    const stripe = new Stripe(stripeKey);
    const pi = await stripe.paymentIntents.retrieve(sale.stripePaymentIntentId);
    if (!pi.client_secret) {
      return NextResponse.json({ error: "決済情報を取得できませんでした" }, { status: 500 });
    }
    return NextResponse.json({
      saleId: sale.id,
      amountYen: sale.totalYen,
      clientSecret: pi.client_secret,
      locationId,
      connectedAccountId: organizer.stripe_account_id,
      alreadyPaid: false,
    });
  } catch (e) {
    console.error("pos terminal session retrieve:", e);
    return NextResponse.json({ error: "決済情報の取得に失敗しました" }, { status: 500 });
  }
}
