import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getApiUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { getStripeSecretKey } from "@/lib/stripe";

/** POST: Stripe Terminal 用 Connection Token（iPhoneタッチアプリから呼ぶ） */
export async function POST() {
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

  const stripeKey = getStripeSecretKey();
  if (!stripeKey) {
    return NextResponse.json({ error: "決済は現在利用できません" }, { status: 503 });
  }

  const { data: organizer } = await supabase
    .from("organizers")
    .select("stripe_account_id, stripe_account_charges_enabled")
    .eq("id", organizerId)
    .single();

  if (!organizer?.stripe_account_id || !organizer?.stripe_account_charges_enabled) {
    return NextResponse.json(
      { error: "売上受取設定が完了していません" },
      { status: 400 }
    );
  }

  try {
    const stripe = new Stripe(stripeKey);
    const token = await stripe.terminal.connectionTokens.create();
    return NextResponse.json({ secret: token.secret });
  } catch (e) {
    console.error("pos terminal connection-token:", e);
    return NextResponse.json({ error: "タッチ決済の準備に失敗しました" }, { status: 500 });
  }
}
