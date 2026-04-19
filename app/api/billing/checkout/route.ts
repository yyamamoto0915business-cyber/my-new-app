import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { getOrganizerByProfileId } from "@/lib/db/organizers";
import { getAppUrl, getStripeSecretKey } from "@/lib/stripe";

const stripeKey = getStripeSecretKey();
const priceId = process.env.STRIPE_PRICE_ORGANIZER_980 ?? process.env.STRIPE_PRICE_STARTER_980;

/**
 * POST: 月980円サブスクのCheckout Sessionを作成
 */
export async function POST(request: NextRequest) {
  if (!stripeKey || !priceId) {
    return NextResponse.json(
      { error: "Stripeが設定されていません" },
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

  let customerId = organizer.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: organizer.organization_name ?? undefined,
      metadata: { organizer_id: organizerId },
    });
    customerId = customer.id;
    await supabase
      .from("organizers")
      .update({
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", organizerId);
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
}
