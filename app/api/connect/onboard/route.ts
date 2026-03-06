import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { getOrganizerByProfileId } from "@/lib/db/organizers";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const appUrl = process.env.APP_URL || "http://localhost:3000";

/**
 * POST: Stripe Connect Account Link（受取設定の onboarding）
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
  if (!organizer?.stripe_account_id) {
    return NextResponse.json(
      { error: "先に POST /api/connect/create-account でアカウントを作成してください。" },
      { status: 400 }
    );
  }

  const stripe = new Stripe(stripeKey);

  const link = await stripe.accountLinks.create({
    account: organizer.stripe_account_id,
    refresh_url: `${appUrl}/organizer/settings/billing?refresh=1`,
    return_url: `${appUrl}/organizer/settings/billing?connected=1`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: link.url });
}
