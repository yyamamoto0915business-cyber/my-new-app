import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { getOrganizerByProfileId } from "@/lib/db/organizers";
import { getStripeSecretKey } from "@/lib/stripe";

const stripeKey = getStripeSecretKey();

/**
 * POST: Stripe Connect Express アカウント作成
 */
export async function POST(request: NextRequest) {
  if (!stripeKey) {
    return NextResponse.json({ error: "Stripeが設定されていません" }, { status: 503 });
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

  if (organizer.stripe_account_id) {
    return NextResponse.json({
      success: true,
      stripeAccountId: organizer.stripe_account_id,
      message: "既にアカウントがあります。onboard で設定を続けてください。",
    });
  }

  const stripe = new Stripe(stripeKey);

  const rawEmail = organizer.contact_email ?? user.email ?? "";
  const email =
    rawEmail.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail.trim())
      ? rawEmail.trim()
      : undefined;

  let account: Stripe.Account;
  try {
    account = await stripe.accounts.create({
      type: "express",
      country: "JP",
      email,
      metadata: { organizer_id: organizerId },
    });
  } catch (err: unknown) {
    const msg = err instanceof Stripe.errors.StripeError ? err.message : String(err);
    return NextResponse.json({ error: `Stripe 連携エラー: ${msg}` }, { status: 400 });
  }

  await supabase
    .from("organizers")
    .update({
      stripe_account_id: account.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", organizerId);

  return NextResponse.json({
    success: true,
    stripeAccountId: account.id,
    message: "アカウント作成済み。POST /api/connect/onboard で onboarding を行ってください。",
  });
}
