import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getOrganizerIdByEventId } from "@/lib/db/events";
import { getOrganizerByProfileId } from "@/lib/db/organizers";
import { getAppUrl, getStripeSecretKey } from "@/lib/stripe";

const stripeKey = getStripeSecretKey();
const PLATFORM_FEE_RATE = parseFloat(process.env.PLATFORM_FEE_RATE ?? "0.05");
const PLATFORM_FEE_MIN_JPY = parseInt(process.env.PLATFORM_FEE_MIN_JPY ?? "300", 10);

const SPONSOR_TIERS = [10000, 30000, 50000] as const;

/**
 * POST: スポンサー協賛 Checkout（Stripe Connect 分配）
 * ログイン不要
 */
export async function POST(request: NextRequest) {
  if (!stripeKey) {
    return NextResponse.json({ error: "決済は現在利用できません" }, { status: 503 });
  }

  let body: {
    eventId?: string;
    tier?: number;
    sponsorName?: string;
    sponsorCompany?: string;
    sponsorEmail?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { eventId, tier, sponsorName, sponsorCompany, sponsorEmail } = body;
  if (!eventId) {
    return NextResponse.json({ error: "eventId は必須です" }, { status: 400 });
  }
  if (!tier || !SPONSOR_TIERS.includes(tier as (typeof SPONSOR_TIERS)[number])) {
    return NextResponse.json(
      { error: "tier は 10000, 30000, 50000 のいずれかです" },
      { status: 400 }
    );
  }

  const amountJpy = tier as number;

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("id, organizer_id, status, sponsor_enabled")
    .eq("id", eventId)
    .single();

  if (!event) {
    return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
  }
  if (event.status !== "published") {
    return NextResponse.json({ error: "このイベントは公開されていません" }, { status: 400 });
  }
  if (event.sponsor_enabled === false) {
    return NextResponse.json({ error: "このイベントは協賛を受け付けていません" }, { status: 400 });
  }

  const organizerId = event.organizer_id;
  const { data: organizer } = await supabase
    .from("organizers")
    .select("stripe_account_id, stripe_account_charges_enabled")
    .eq("id", organizerId)
    .single();

  if (!organizer?.stripe_account_id || !organizer?.stripe_account_charges_enabled) {
    return NextResponse.json({
      error: "主催者が協賛金の受取設定を完了していません。購入はしばらくお待ちください。",
    }, { status: 400 });
  }

  const platformFeeJpy = Math.max(Math.round(amountJpy * PLATFORM_FEE_RATE), PLATFORM_FEE_MIN_JPY);
  const organizerNetJpy = amountJpy - platformFeeJpy;

  const stripe = new Stripe(stripeKey);
  const appUrl = getAppUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "jpy",
          product_data: {
            name: `イベント協賛（¥${amountJpy.toLocaleString()}）`,
            description: `協賛金 ¥${amountJpy.toLocaleString()}（手数料 ¥${platformFeeJpy.toLocaleString()}、主催者へ ¥${organizerNetJpy.toLocaleString()}）`,
          },
          unit_amount: amountJpy,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: platformFeeJpy,
      transfer_data: { destination: organizer.stripe_account_id },
      metadata: {
        eventId,
        organizerId,
        tier: String(tier),
        platformFeeJpy: String(platformFeeJpy),
      },
    },
    success_url: `${appUrl}/events/${eventId}?sponsor=success`,
    cancel_url: `${appUrl}/events/${eventId}?sponsor=cancel`,
    customer_email: sponsorEmail?.trim() || undefined,
  });

  if (!session.url) {
    return NextResponse.json({ error: "Checkout URLの作成に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
