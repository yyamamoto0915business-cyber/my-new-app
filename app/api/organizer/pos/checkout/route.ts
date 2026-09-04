import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getApiUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import {
  attachStripeSessionToSale,
  createCashSale,
  createPendingOnlineSale,
} from "@/lib/db/pos";
import { getAppUrl, getStripeSecretKey } from "@/lib/stripe";

type LineBody = { productId?: string; quantity?: number };

/** POST: 現金会計 or オンライン決済セッション作成 */
export async function POST(request: NextRequest) {
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

  let body: {
    paymentMethod?: "cash" | "online";
    eventId?: string | null;
    lines?: LineBody[];
    cashReceivedYen?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const paymentMethod = body.paymentMethod;
  if (paymentMethod !== "cash" && paymentMethod !== "online") {
    return NextResponse.json({ error: "支払い方法が不正です" }, { status: 400 });
  }

  const lines = (body.lines ?? [])
    .filter((l) => l.productId && Number(l.quantity) > 0)
    .map((l) => ({
      productId: String(l.productId),
      quantity: Math.floor(Number(l.quantity)),
    }));

  if (lines.length === 0) {
    return NextResponse.json({ error: "カートが空です" }, { status: 400 });
  }

  const eventId = body.eventId || null;

  if (paymentMethod === "cash") {
    try {
      const sale = await createCashSale(supabase, organizerId, {
        eventId,
        lines,
        cashReceivedYen: Number(body.cashReceivedYen ?? 0),
      });
      return NextResponse.json({ sale });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "insufficient_cash") {
        return NextResponse.json({ error: "お預かり金額が不足しています" }, { status: 400 });
      }
      if (msg === "empty_cart" || msg === "invalid_line") {
        return NextResponse.json({ error: "カートの内容が不正です" }, { status: 400 });
      }
      console.error("pos cash checkout:", e);
      return NextResponse.json({ error: "会計に失敗しました" }, { status: 500 });
    }
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
      {
        error:
          "オンライン決済には Stripe 受取設定が必要です。「クレジット・オンライン決済」から設定してください。",
      },
      { status: 400 }
    );
  }

  try {
    const { sale, platformFeeYen } = await createPendingOnlineSale(supabase, organizerId, {
      eventId,
      lines,
    });

    const stripe = new Stripe(stripeKey);
    const appUrl = getAppUrl();
    const lineItems = (sale.items ?? []).map((item) => ({
      price_data: {
        currency: "jpy" as const,
        product_data: {
          name: item.productName,
        },
        unit_amount: item.unitPriceYen,
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      payment_intent_data: {
        application_fee_amount: platformFeeYen,
        transfer_data: { destination: organizer.stripe_account_id },
        metadata: {
          type: "pos",
          saleId: sale.id,
          organizerId,
          eventId: eventId ?? "",
          platformFeeJpy: String(platformFeeYen),
        },
      },
      metadata: {
        type: "pos",
        saleId: sale.id,
        organizerId,
        eventId: eventId ?? "",
        platformFeeJpy: String(platformFeeYen),
      },
      success_url: `${appUrl}/organizer/pos?paid=1&saleId=${sale.id}`,
      cancel_url: `${appUrl}/organizer/pos?cancelled=1&saleId=${sale.id}`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "決済URLの作成に失敗しました" }, { status: 500 });
    }

    await attachStripeSessionToSale(supabase, sale.id, organizerId, session.id);

    return NextResponse.json({
      sale: { ...sale, stripeCheckoutSessionId: session.id },
      checkoutUrl: session.url,
      platformFeeYen,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "empty_cart" || msg === "invalid_line") {
      return NextResponse.json({ error: "カートの内容が不正です" }, { status: 400 });
    }
    console.error("pos online checkout:", e);
    return NextResponse.json({ error: "オンライン決済の開始に失敗しました" }, { status: 500 });
  }
}
