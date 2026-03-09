import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getStripe, getAppUrl } from "@/lib/stripe";
import { getParticipantStatus } from "@/lib/db/events";

/** POST: 有料イベント参加費決済 Checkout Session を生成 */
export async function POST(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "決済は現在利用できません" }, { status: 503 });
  }

  let body: { eventId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { eventId } = body;
  if (!eventId) {
    return NextResponse.json({ error: "eventId は必須です" }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
  }

  const { data: eventRow } = await supabase
    .from("events")
    .select("id, title, price, stripe_price_id, participation_mode, requires_registration")
    .eq("id", eventId)
    .eq("status", "published")
    .single();

  if (!eventRow) {
    return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
  }

  const participationMode =
    (eventRow as { participation_mode?: string; requires_registration?: boolean }).participation_mode ??
    ((eventRow as { requires_registration?: boolean }).requires_registration ? "required" : "none");
  if (participationMode !== "required") {
    return NextResponse.json(
      { error: "このイベントは申込制ではありません" },
      { status: 400 }
    );
  }

  const price = (eventRow as { price?: number }).price ?? 0;
  if (price <= 0) {
    return NextResponse.json(
      { error: "無料イベントは通常の申込導線をご利用ください" },
      { status: 400 }
    );
  }

  const existing = await getParticipantStatus(supabase, eventId, user.id);
  if (existing) {
    return NextResponse.json(
      { error: "すでに申し込み済みです", status: existing },
      { status: 400 }
    );
  }

  const appUrl = getAppUrl();

  const stripePriceId = (eventRow as { stripe_price_id?: string | null }).stripe_price_id;
  const lineItem:
    | { price: string; quantity: number }
    | {
        price_data: {
          currency: string;
          product_data: { name: string; description?: string; metadata: Record<string, string> };
          unit_amount: number;
        };
        quantity: number;
      } = stripePriceId?.startsWith("price_")
    ? { price: stripePriceId, quantity: 1 }
    : {
        price_data: {
          currency: "jpy",
          product_data: {
            name: (eventRow as { title?: string }).title ?? "イベント参加費",
            description: `参加費 ¥${price.toLocaleString()}`,
            metadata: { eventId },
          },
          unit_amount: price,
        },
        quantity: 1,
      };

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [lineItem],
    metadata: {
      type: "event",
      eventId,
      userId: user.id,
      amount: String(price),
    },
    success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/events/${eventId}?event=cancel`,
    customer_email: user.email ?? undefined,
  });

  if (!session.url) {
    return NextResponse.json({ error: "Checkout URLの作成に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
