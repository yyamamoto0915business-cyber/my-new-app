import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { getOrganizerByProfileId } from "@/lib/db/organizers";

const stripeKey = process.env.STRIPE_SECRET_KEY;

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

  const account = await stripe.accounts.create({
    type: "express",
    country: "JP",
    email: organizer.contact_email ?? user.email ?? undefined,
    metadata: { organizer_id: organizerId },
  });

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
