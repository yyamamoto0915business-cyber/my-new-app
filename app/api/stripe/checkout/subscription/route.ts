import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getStripe, getAppUrl } from "@/lib/stripe";
import { getOrganizerByProfileId } from "@/lib/db/organizers";

const PRICE_ID = process.env.STRIPE_PRICE_ORGANIZER_980 ?? process.env.STRIPE_PRICE_STARTER_980;

/** POST: 主催者月額プラン Checkout Session を生成（subscription mode） */
export async function POST(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const stripe = getStripe();
  if (!stripe || !PRICE_ID) {
    return NextResponse.json({ error: "主催者プランは現在利用できません" }, { status: 503 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
  }

  const organizer = await getOrganizerByProfileId(supabase, user.id);
  if (!organizer) {
    return NextResponse.json({ error: "主催者登録がありません。まず主催者登録を行ってください。" }, { status: 400 });
  }

  const appUrl = getAppUrl();

  const customerId = organizer.stripe_customer_id ?? undefined;

  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: PRICE_ID,
        quantity: 1,
      },
    ],
    metadata: {
      type: "organizer_subscription",
      organizer_id: organizer.id,
      user_id: user.id,
    },
    subscription_data: {
      metadata: {
        organizer_id: organizer.id,
        user_id: user.id,
      },
    },
    success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/organizer?subscription=cancel`,
    customer_email: customerId ? undefined : (user.email ?? undefined),
  };

  if (customerId) {
    sessionConfig.customer = customerId;
  }

  const session = await stripe.checkout.sessions.create(sessionConfig);

  if (!session.url) {
    return NextResponse.json({ error: "Checkout URLの作成に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
