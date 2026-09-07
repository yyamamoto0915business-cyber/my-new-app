import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getApiUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import {
  getPosSaleById,
  markPosSaleRefunded,
} from "@/lib/db/pos";
import { getStripeSecretKey } from "@/lib/stripe";

type Params = { params: Promise<{ id: string }> };

/**
 * POST: 会計の全額返金（現金は記録のみ、オンラインは Stripe 返金）
 */
export async function POST(_request: NextRequest, { params }: Params) {
  const { id: saleId } = await params;
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

  let sale;
  try {
    sale = await getPosSaleById(supabase, organizerId, saleId);
  } catch (e) {
    console.error("pos refund GET sale:", e);
    return NextResponse.json({ error: "会計の取得に失敗しました" }, { status: 500 });
  }

  if (!sale) {
    return NextResponse.json({ error: "会計が見つかりません" }, { status: 404 });
  }
  if (sale.status === "refunded") {
    return NextResponse.json({ sale, message: "すでに返金済みです" });
  }
  if (sale.status !== "paid") {
    return NextResponse.json({ error: "この会計は返金できません" }, { status: 400 });
  }

  if (sale.paymentMethod !== "cash") {
    const stripeKey = getStripeSecretKey();
    if (!stripeKey) {
      return NextResponse.json({ error: "決済は現在利用できません" }, { status: 503 });
    }

    const stripe = new Stripe(stripeKey);
    let paymentIntentId = sale.stripePaymentIntentId;

    try {
      if (!paymentIntentId && sale.stripeCheckoutSessionId) {
        const session = await stripe.checkout.sessions.retrieve(sale.stripeCheckoutSessionId);
        paymentIntentId =
          typeof session.payment_intent === "string" ? session.payment_intent : null;
        if (paymentIntentId) {
          await supabase
            .from("pos_sales")
            .update({ stripe_payment_intent_id: paymentIntentId })
            .eq("id", sale.id)
            .eq("organizer_id", organizerId);
        }
      }

      if (!paymentIntentId) {
        return NextResponse.json(
          { error: "決済情報が見つからないため、返金できません。Stripeダッシュボードから返金してください。" },
          { status: 400 }
        );
      }

      await stripe.refunds.create({
        payment_intent: paymentIntentId,
        reverse_transfer: true,
        refund_application_fee: true,
        metadata: {
          type: "pos",
          saleId: sale.id,
          organizerId,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Stripe.errors.StripeError ? err.message : String(err);
      console.error("pos stripe refund:", msg);
      if (/already been refunded|has already been refunded/i.test(msg)) {
        // Stripe 側は返金済み → DB だけ同期
      } else {
        return NextResponse.json(
          { error: `返金に失敗しました: ${msg}` },
          { status: 400 }
        );
      }
    }
  }

  try {
    const updated = await markPosSaleRefunded(supabase, organizerId, saleId);
    if (!updated) {
      return NextResponse.json({ error: "返金の記録に失敗しました" }, { status: 500 });
    }
    return NextResponse.json({
      sale: updated,
      message:
        sale.paymentMethod === "cash"
          ? "現金の返金として記録しました。お客様へ現金をお戻しください。"
          : "返金が完了しました。",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "not_refundable") {
      return NextResponse.json({ error: "この会計は返金できません" }, { status: 400 });
    }
    console.error("pos refund mark:", e);
    return NextResponse.json({ error: "返金の記録に失敗しました" }, { status: 500 });
  }
}
