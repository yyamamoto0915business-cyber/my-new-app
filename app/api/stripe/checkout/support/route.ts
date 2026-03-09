import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getStripe, getAppUrl } from "@/lib/stripe";

const SUPPORT_AMOUNTS = [500, 1000, 3000] as const;

/** POST: 応援決済 Checkout Session を生成（500/1000/3000円） */
export async function POST(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "決済は現在利用できません" }, { status: 503 });
  }

  let body: { eventId?: string; amount?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { eventId, amount } = body;
  if (!eventId) {
    return NextResponse.json({ error: "eventId は必須です" }, { status: 400 });
  }
  if (!amount || !SUPPORT_AMOUNTS.includes(amount as (typeof SUPPORT_AMOUNTS)[number])) {
    return NextResponse.json(
      { error: "amount は 500, 1000, 3000 のいずれかです" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("id, organizer_id, status")
    .eq("id", eventId)
    .single();

  if (!event) {
    return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
  }
  if (event.status !== "published") {
    return NextResponse.json({ error: "このイベントは公開されていません" }, { status: 400 });
  }

  const appUrl = getAppUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "jpy",
          product_data: {
            name: "イベント応援",
            description: `応援金 ¥${amount.toLocaleString()}`,
            metadata: { eventId },
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: "support",
      eventId,
      userId: user.id,
      amount: String(amount),
    },
    success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/events/${eventId}?support=cancel`,
    customer_email: user.email ?? undefined,
  });

  if (!session.url) {
    return NextResponse.json({ error: "Checkout URLの作成に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
