import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getApiUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import {
  attachStripePaymentIntentToSale,
  attachStripeSessionToSale,
  createCashSale,
  createPendingOnlineSale,
  listPosProducts,
} from "@/lib/db/pos";
import { getAppUrl, getStripeSecretKey } from "@/lib/stripe";
import {
  getStripeTerminalLocationId,
  POS_TAP_PAYMENT_TYPE,
  posTapAppLink,
} from "@/lib/pos/tap-app";
import { requireOrganizerFeature } from "@/lib/organizer/require-organizer-feature";
import { planPointExchange } from "@/lib/pos/point-exchange";
import { planPointDiscount } from "@/lib/pos/point-discount";
import {
  lookupPosPointsHolder,
  redeemPosPoints,
  restorePosPoints,
} from "@/lib/points/pos-points";

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
  const planBlocked = await requireOrganizerFeature(supabase, organizerId, "pos");
  if (planBlocked) return planBlocked;

  let body: {
    paymentMethod?: "cash" | "online" | "tap";
    eventId?: string | null;
    lines?: LineBody[];
    cashReceivedYen?: number;
    /** イベントポイントを使うとき：読み取った参加パスのQR（会計のときにもう一度サーバーで読み直す） */
    pointsQr?: string | null;
    /** 割引のとき：使うポイント（なければ使えるだけ全部。サーバーで上限に合わせ直す） */
    pointsToUse?: number | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const paymentMethod = body.paymentMethod;
  if (paymentMethod !== "cash" && paymentMethod !== "online" && paymentMethod !== "tap") {
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
  const pointsQr = typeof body.pointsQr === "string" ? body.pointsQr.trim() : "";

  // スマホ払い・カードタッチの前提（ポイントを使う前に確かめる。あとで止まるとポイントを戻す手間が増えるため）
  const stripeKey = paymentMethod === "cash" ? null : getStripeSecretKey();
  let organizer: { stripe_account_id: string | null; stripe_account_charges_enabled: boolean | null } | null = null;
  let tapLocationId: string | null = null;
  if (paymentMethod !== "cash") {
    if (!stripeKey) {
      return NextResponse.json({ error: "決済は現在利用できません" }, { status: 503 });
    }
    const { data } = await supabase
      .from("organizers")
      .select("stripe_account_id, stripe_account_charges_enabled")
      .eq("id", organizerId)
      .single();
    organizer = data;
    if (!organizer?.stripe_account_id || !organizer?.stripe_account_charges_enabled) {
      return NextResponse.json(
        {
          error:
            "オンライン決済には売上受取設定が必要です。「売上受取設定」から設定してください。",
        },
        { status: 400 }
      );
    }
    if (paymentMethod === "tap") {
      tapLocationId = getStripeTerminalLocationId() ?? null;
      if (!tapLocationId) {
        return NextResponse.json(
          {
            error:
              "カードタッチはまだ店舗設定がありません。いまはスマホ払いをご利用ください。",
          },
          { status: 503 }
        );
      }
    }
  }

  // イベントポイントを使うとき：先にポイントを使って（足りなければここで止まる）、同じ会計IDで売上を記録する。
  // スマホ払い・カードタッチは、支払いが終わるまで「預かり」。やめた・払われなかったときは戻す（lib/pos/pending-sales.ts）
  let points:
    | {
        userId: string;
        eventId: string;
        saleId: string;
        amount: number;
        byProduct?: Map<string, { units: number; points: number }>;
        discount?: { points: number; yen: number };
        /** お客様のスマホに出す割引の行の名前 */
        label: string;
      }
    | null = null;
  if (pointsQr) {
    if (!eventId) {
      return NextResponse.json({ error: "ポイントを使うには、イベントを選んでください" }, { status: 400 });
    }
    const lookup = await lookupPosPointsHolder(supabase, organizerId, eventId, pointsQr);
    if (!lookup.ok) return NextResponse.json({ error: lookup.error }, { status: lookup.status });

    let products;
    try {
      products = await listPosProducts(supabase, organizerId, { eventId, activeOnly: true });
    } catch (e) {
      console.error("pos checkout products:", e);
      return NextResponse.json({ error: "会計に失敗しました" }, { status: 500 });
    }
    const byId = new Map(products.map((p) => [p.id, p]));

    // 交換：商品ごとに ¥0 にする／割引：会計全体から引く
    let pointsUsed = 0;
    let payYen = 0;
    let byProduct: Map<string, { units: number; points: number }> | undefined;
    let discount: { points: number; yen: number } | undefined;
    if (lookup.availability.mode === "discount") {
      const subtotal = lines.reduce((sum, l) => sum + (byId.get(l.productId)?.priceYen ?? 0) * l.quantity, 0);
      const requested = body.pointsToUse == null ? null : Number(body.pointsToUse);
      const plan = planPointDiscount(
        subtotal,
        lookup.holder.balance,
        { yenPerPoint: lookup.availability.yenPerPoint, maxYen: lookup.availability.discountMaxYen },
        requested != null && Number.isFinite(requested) ? requested : null
      );
      pointsUsed = plan.pointsUsed;
      payYen = plan.payYen;
      if (plan.pointsUsed > 0) discount = { points: plan.pointsUsed, yen: plan.discountYen };
    } else {
      const plan = planPointExchange(
        lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitPriceYen: byId.get(l.productId)?.priceYen ?? 0,
          pointPrice: byId.get(l.productId)?.pointPrice ?? null,
        })),
        lookup.holder.balance
      );
      pointsUsed = plan.pointsUsed;
      payYen = plan.payYen;
      byProduct = new Map(
        plan.lines.filter((l) => l.units > 0).map((l) => [l.productId, { units: l.units, points: l.points }])
      );
    }

    if (paymentMethod === "cash") {
      // お預かりが足りないときは、ポイントを使う前に止める
      if (Math.max(0, Math.round(Number(body.cashReceivedYen ?? 0))) < payYen) {
        return NextResponse.json({ error: "お預かり金額が不足しています" }, { status: 400 });
      }
    } else if (pointsUsed > 0 && payYen <= 0) {
      return NextResponse.json(
        { error: "ポイントだけで払えるので、お支払い方法を「現金」にして会計してください（お預かり ¥0）" },
        { status: 400 }
      );
    }
    if (pointsUsed > 0) {
      points = {
        userId: lookup.holder.userId,
        eventId,
        saleId: crypto.randomUUID(),
        amount: pointsUsed,
        ...(byProduct ? { byProduct } : {}),
        ...(discount ? { discount } : {}),
        label: discount ? `ポイント割引（${pointsUsed}pt）` : `ポイントで交換（${pointsUsed}pt）`,
      };
      const redeemed = await redeemPosPoints({
        userId: points.userId,
        eventId,
        amount: points.amount,
        saleId: points.saleId,
      });
      if (!redeemed.ok) {
        return NextResponse.json(
          {
            error:
              redeemed.error === "insufficient_points"
                ? "ポイントが足りません。もう一度読み取ってください"
                : "ポイントを使えませんでした。時間をおいてお試しください",
          },
          { status: 400 }
        );
      }
    }
  }

  /** 途中で失敗したとき：先に使ったポイントを戻して、途中まで記録された会計は取り消し扱いにする */
  async function undoPoints() {
    if (!points || !supabase) return;
    await restorePosPoints({ userId: points.userId, eventId: points.eventId, saleId: points.saleId });
    await supabase
      .from("pos_sales")
      .update({ status: "cancelled" })
      .eq("id", points.saleId)
      .eq("organizer_id", organizerId!);
  }

  if (paymentMethod === "cash") {
    try {
      const sale = await createCashSale(supabase, organizerId, {
        eventId,
        lines,
        cashReceivedYen: Number(body.cashReceivedYen ?? 0),
        ...(points
          ? {
              saleId: points.saleId,
              points: { userId: points.userId, byProduct: points.byProduct, discount: points.discount },
            }
          : {}),
      });
      return NextResponse.json({ sale });
    } catch (e) {
      // 売上を記録できなかったら、先に使ったポイントを戻す
      await undoPoints();
      const msg = e instanceof Error ? e.message : "";
      if (msg === "insufficient_cash") {
        return NextResponse.json({ error: "お預かり金額が不足しています" }, { status: 400 });
      }
      if (msg === "empty_cart" || msg === "invalid_line" || msg === "invalid_discount") {
        return NextResponse.json({ error: "カートの内容が不正です" }, { status: 400 });
      }
      console.error("pos cash checkout:", e);
      return NextResponse.json({ error: "会計に失敗しました" }, { status: 500 });
    }
  }

  // ここからスマホ払い・カードタッチ（前提のチェックはポイントを使う前に済ませている）
  if (!stripeKey || !organizer?.stripe_account_id) {
    await undoPoints();
    return NextResponse.json({ error: "決済は現在利用できません" }, { status: 503 });
  }
  const destination = organizer.stripe_account_id as string;
  const stripe = new Stripe(stripeKey);
  // 途中で失敗したとき、作った決済を止めてから（払えないようにしてから）ポイントを戻す
  let createdSessionId: string | null = null;
  let createdPaymentIntentId: string | null = null;

  try {
    const { sale, platformFeeYen, listYen } = await createPendingOnlineSale(supabase, organizerId, {
      eventId,
      lines,
      paymentMethod: paymentMethod === "tap" ? "tap" : "online",
      ...(points
        ? {
            saleId: points.saleId,
            points: { userId: points.userId, byProduct: points.byProduct, discount: points.discount },
          }
        : {}),
    });
    const pointsInfo = points
      ? { pointsUsed: sale.pointsUsed, discountYen: listYen - sale.totalYen }
      : null;

    if (paymentMethod === "tap") {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: sale.totalYen,
        currency: "jpy",
        payment_method_types: ["card_present"],
        capture_method: "automatic",
        application_fee_amount: platformFeeYen,
        transfer_data: { destination },
        on_behalf_of: destination,
        metadata: {
          type: POS_TAP_PAYMENT_TYPE,
          saleId: sale.id,
          organizerId,
          eventId: eventId ?? "",
          platformFeeJpy: String(platformFeeYen),
          pointsUsed: String(sale.pointsUsed || 0),
        },
      });
      createdPaymentIntentId = paymentIntent.id;

      await attachStripePaymentIntentToSale(supabase, sale.id, organizerId, paymentIntent.id);

      return NextResponse.json({
        sale: { ...sale, stripePaymentIntentId: paymentIntent.id },
        appLink: posTapAppLink(sale.id),
        locationId: tapLocationId,
        connectedAccountId: destination,
        platformFeeYen,
        points: pointsInfo,
      });
    }

    const appUrl = getAppUrl();
    // 商品は定価で並べ、ポイントの分は「ポイント割引」「ポイントで交換」の行（その会計だけのクーポン）で引く
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
    const offYen = listYen - sale.totalYen;
    const coupon =
      points && offYen > 0
        ? await stripe.coupons.create({
            amount_off: offYen,
            currency: "jpy",
            duration: "once",
            max_redemptions: 1,
            name: points.label,
            metadata: { type: "pos", saleId: sale.id },
          })
        : null;

    // card にすると Apple Pay / Google Pay も出る。PayPay は Connect 非対応のため入れない。
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "ja",
      submit_type: "pay",
      billing_address_collection: "auto",
      payment_method_types: ["card"],
      line_items: lineItems,
      ...(coupon ? { discounts: [{ coupon: coupon.id }] } : {}),
      // ポイントを預かっているときは、30分で決済ページを切る（切れたらポイントを戻す）
      ...(points ? { expires_at: Math.floor(Date.now() / 1000) + 31 * 60 } : {}),
      custom_text: {
        submit: {
          message:
            "カード番号の手入力は不要です。Apple Pay または Google Pay でお支払いください。",
        },
      },
      payment_intent_data: {
        application_fee_amount: platformFeeYen,
        transfer_data: { destination },
        metadata: {
          type: "pos",
          saleId: sale.id,
          organizerId,
          eventId: eventId ?? "",
          platformFeeJpy: String(platformFeeYen),
          pointsUsed: String(sale.pointsUsed || 0),
        },
      },
      metadata: {
        type: "pos",
        saleId: sale.id,
        organizerId,
        eventId: eventId ?? "",
        platformFeeJpy: String(platformFeeYen),
        pointsUsed: String(sale.pointsUsed || 0),
      },
      success_url: `${appUrl}/organizer/pos?paid=1&saleId=${sale.id}`,
      cancel_url: `${appUrl}/organizer/pos?cancelled=1&saleId=${sale.id}`,
    });
    createdSessionId = session.id;

    if (!session.url) {
      throw new Error("no_checkout_url");
    }

    await attachStripeSessionToSale(supabase, sale.id, organizerId, session.id);

    return NextResponse.json({
      sale: { ...sale, stripeCheckoutSessionId: session.id },
      checkoutUrl: session.url,
      platformFeeYen,
      points: pointsInfo,
    });
  } catch (e) {
    // 作りかけの決済を止めてから、ポイントを戻す
    if (createdSessionId) await stripe.checkout.sessions.expire(createdSessionId).catch(() => {});
    if (createdPaymentIntentId) await stripe.paymentIntents.cancel(createdPaymentIntentId).catch(() => {});
    await undoPoints();
    const msg = e instanceof Error ? e.message : "";
    if (msg === "empty_cart" || msg === "invalid_line" || msg === "invalid_discount") {
      return NextResponse.json({ error: "カートの内容が不正です" }, { status: 400 });
    }
    console.error("pos online checkout:", e);
    return NextResponse.json({ error: "オンライン決済の開始に失敗しました" }, { status: 500 });
  }
}
