import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { getOrganizerByProfileId } from "@/lib/db/organizers";
import { getAppUrl, getStripeSecretKey } from "@/lib/stripe";

const stripeKey = getStripeSecretKey();
const priceId = process.env.STRIPE_PRICE_ORGANIZER_980 ?? process.env.STRIPE_PRICE_STARTER_980;

function stripeErrorToUserMessage(err: Stripe.errors.StripeError): string {
  const code = err.code;
  const msg = err.message ?? "";
  if (code === "resource_missing" && /price/i.test(msg)) {
    return "料金プラン（Price ID）が Stripe 上に見つかりません。本番ダッシュボードの Product にある Price ID を STRIPE_PRICE_ORGANIZER_980（または STRIPE_PRICE_STARTER_980）に設定し、再デプロイしてください。";
  }
  if (/test mode.*live mode|live mode.*test mode/i.test(msg)) {
    return "Stripe のモードが一致していません。本番サイトでは STRIPE_SECRET_KEY と Price ID の両方をライブモードのものにしてください。";
  }
  if (code === "api_key_expired" || code === "invalid_api_key") {
    return "Stripe の秘密鍵が無効です。STRIPE_SECRET_KEY を確認してください。";
  }
  return `Stripe: ${msg}`;
}

/**
 * POST: 月980円サブスクのCheckout Sessionを作成
 */
export async function POST() {
  if (!stripeKey || !priceId) {
    return NextResponse.json(
      { error: "Stripeが設定されていません（STRIPE_SECRET_KEY または料金用 Price ID）" },
      { status: 503 }
    );
  }

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

  const organizer = await getOrganizerByProfileId(supabase, user.id);
  if (!organizer) {
    return NextResponse.json({ error: "主催者情報を取得できません" }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey);
  const appUrl = getAppUrl();

  try {
    let customerId = organizer.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: organizer.organization_name ?? undefined,
        metadata: { organizer_id: organizerId },
      });
      customerId = customer.id;
      const { error: updateErr } = await supabase
        .from("organizers")
        .update({
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", organizerId);
      if (updateErr) {
        console.error("[api/billing/checkout] supabase update stripe_customer_id", updateErr);
        return NextResponse.json(
          { error: "顧客情報の保存に失敗しました。しばらく経ってから再度お試しください。" },
          { status: 500 }
        );
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/organizer/settings/plan?checkout=cancel`,
      subscription_data: {
        metadata: { organizer_id: organizerId, user_id: user.id },
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Checkout URLの作成に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("[api/billing/checkout]", err);
    if (err instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: stripeErrorToUserMessage(err) },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: "決済セッションの作成に失敗しました。時間をおいて再度お試しください。" },
      { status: 500 }
    );
  }
}
