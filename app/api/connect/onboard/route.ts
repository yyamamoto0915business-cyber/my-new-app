import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { getOrganizerByProfileId } from "@/lib/db/organizers";
import { getStripeSecretKey } from "@/lib/stripe";
import { getPublicOriginForStripeRedirect } from "@/lib/stripe-redirect-origin";

const stripeKey = getStripeSecretKey();

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
  const appUrl = getPublicOriginForStripeRedirect(request);

  let returnTo: "pos" | "payouts" = "payouts";
  try {
    const raw = await request.text();
    if (raw.trim()) {
      const body = JSON.parse(raw) as { returnTo?: unknown };
      if (body.returnTo === "pos") returnTo = "pos";
    }
  } catch {
    returnTo = "payouts";
  }

  const basePath =
    returnTo === "pos" ? "/organizer/pos" : "/organizer/settings/payouts";

  try {
    const link = await stripe.accountLinks.create({
      account: organizer.stripe_account_id,
      refresh_url: `${appUrl}${basePath}?refresh=1`,
      return_url: `${appUrl}${basePath}?connected=1`,
      type: "account_onboarding",
    });
    return NextResponse.json({ url: link.url });
  } catch (err: unknown) {
    const msg = err instanceof Stripe.errors.StripeError ? err.message : String(err);
    const noSuch =
      /no such account/i.test(msg) ||
      /not connected to your platform/i.test(msg) ||
      /does not exist/i.test(msg) ||
      /was created in test mode/i.test(msg) ||
      /test mode.*live mode/i.test(msg);
    return NextResponse.json(
      {
        error: noSuch
          ? "保存されている Stripe 連携先が、いまの秘密鍵（本番/テスト）と一致しません。連携をやり直してから、もう一度設定を始めてください。"
          : `Stripe 連携エラー: ${msg}`,
        code: noSuch ? "stripe_connect_mismatch" : undefined,
      },
      { status: 400 }
    );
  }
}
