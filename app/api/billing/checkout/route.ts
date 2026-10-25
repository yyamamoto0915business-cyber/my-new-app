import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { getOrganizerByProfileId } from "@/lib/db/organizers";
import { getAppUrl, getStripeSecretKey } from "@/lib/stripe";
import { isIosAppUserAgent } from "@/lib/native/app-shell";
import { getOrganizerPlanPriceId, organizerPlanColumnForPrice } from "@/lib/organizer-plan-prices";

const PAID_SUBSCRIPTION_STATUSES = ["active", "trialing", "past_due"];

function stripeErrorToUserMessage(err: Stripe.errors.StripeError): string {
  const code = err.code;
  const msg = err.message ?? "";
  if (code === "resource_missing" && /price/i.test(msg)) {
    return "料金プラン（Price ID）が Stripe 上に見つかりません。本番ダッシュボードの Product にある Price ID を STRIPE_PRICE_ORGANIZER_980 / STRIPE_PRICE_ORGANIZER_GAME_2980 に設定し、再デプロイしてください。";
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
 * POST: 主催者サブスク（STANDARD 月980円 / GAME 月2,980円）
 * body: { plan?: "standard" | "game" }
 * 未契約なら Checkout Session を作成、契約中なら同じサブスクの Price を差し替える（日割り）
 */
export async function POST(request: NextRequest) {
  if (isIosAppUserAgent(request.headers.get("user-agent"))) {
    return NextResponse.json(
      { error: "アプリ内ではこのプランを申し込めません。" },
      { status: 403 }
    );
  }
  const body = (await request.json().catch(() => ({}))) as { plan?: unknown };
  const plan = body.plan === "game" ? "game" : "standard";
  const stripeKey = getStripeSecretKey();
  const priceId = getOrganizerPlanPriceId(plan);
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

  /** 課金関連の列は本人の権限では更新できない（00111 のトリガー）ため Service Role で書く */
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "サーバーの設定が不足しています" }, { status: 503 });
  }

  const stripe = new Stripe(stripeKey);
  const appUrl = getAppUrl();

  try {
    if (
      organizer.stripe_subscription_id &&
      PAID_SUBSCRIPTION_STATUSES.includes(organizer.subscription_status ?? "")
    ) {
      const subscription = await stripe.subscriptions.retrieve(organizer.stripe_subscription_id);
      const item = subscription.items.data[0];
      if (item && PAID_SUBSCRIPTION_STATUSES.includes(subscription.status)) {
        if (item.price.id === priceId) {
          return NextResponse.json({ error: "すでにこのプランをご利用中です" }, { status: 400 });
        }
        await stripe.subscriptions.update(subscription.id, {
          items: [{ id: item.id, price: priceId }],
          proration_behavior: "create_prorations",
        });
        // Webhook より先に画面へ反映させる（Webhook でも同じ値に更新される）
        await admin
          .from("organizers")
          .update({
            plan: organizerPlanColumnForPrice(priceId),
            updated_at: new Date().toISOString(),
          })
          .eq("id", organizerId);
        return NextResponse.json({ updated: true });
      }
    }

    let customerId = organizer.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: organizer.organization_name ?? undefined,
        metadata: { organizer_id: organizerId },
      });
      customerId = customer.id;
      const { error: updateErr } = await admin
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
