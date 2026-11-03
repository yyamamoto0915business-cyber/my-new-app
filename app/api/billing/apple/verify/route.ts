import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyAppleTransaction, verifyAppleTransaction } from "@/lib/apple-iap/server";

const bodySchema = z.object({
  /** StoreKit 2 の Transaction.jwsRepresentation（購入直後・購入の復元のとき） */
  signedTransactions: z.array(z.string().min(1)).min(1).max(20),
});

const FAILED = "購入の確認に失敗しました。時間をおいて「購入を復元」をお試しください。";

/**
 * POST: アプリで App 内課金を買った・復元したあとに呼ぶ。
 * Apple の署名を確かめてから、ログイン中の主催者のプランに反映する。
 */
export async function POST(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "購入情報が正しくありません" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: FAILED }, { status: 503 });
  }

  // 復元のときは複数届くので、有効期限がいちばん先のものを反映する
  const verified = [];
  for (const signed of parsed.data.signedTransactions) {
    try {
      verified.push(await verifyAppleTransaction(signed));
    } catch (err) {
      console.error("[apple-iap] verify failed:", err);
    }
  }
  const latest = verified
    .filter((t) => !t.appAccountToken || t.appAccountToken === user.id)
    .sort((a, b) => (b.expiresDate ?? 0) - (a.expiresDate ?? 0))[0];

  if (!latest) {
    return NextResponse.json({ error: FAILED }, { status: 400 });
  }

  const result = await applyAppleTransaction(admin, latest, { expectedProfileId: user.id });
  if (!result.ok) {
    const message =
      result.reason === "stripe_active"
        ? "Web（クレジットカード）で契約中のプランがあります。二重のお支払いにならないよう、Web の契約を解約してからお申し込みください。"
        : result.reason === "not_found"
          ? "主催者の登録が見つかりませんでした。主催者登録を済ませてからお試しください。"
          : FAILED;
    return NextResponse.json({ error: message, reason: result.reason }, { status: 409 });
  }

  return NextResponse.json({ ok: true, plan: result.plan });
}
