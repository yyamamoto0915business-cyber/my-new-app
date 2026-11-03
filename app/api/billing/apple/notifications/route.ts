import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  applyAppleTransaction,
  verifyAppleNotification,
  verifyAppleRenewalInfo,
  verifyAppleTransaction,
} from "@/lib/apple-iap/server";

/**
 * POST: App Store Server Notifications V2 の受け口。
 * App Store Connect の「App Store サーバ通知」に、本番・サンドボックスともこの URL を登録する。
 * 更新・解約・返金などを主催者プランに反映する。
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { signedPayload?: unknown } | null;
  const signedPayload = typeof body?.signedPayload === "string" ? body.signedPayload : null;
  if (!signedPayload) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  let notification;
  try {
    notification = await verifyAppleNotification(signedPayload);
  } catch (err) {
    console.error("[apple-iap] notification verify failed:", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const data = notification.data;
  if (!data?.signedTransactionInfo) {
    // TEST 通知など、取引のないものは受け取ったことだけ返す
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  if (!admin) {
    // 500 を返すと Apple があとで送り直してくれる
    return NextResponse.json({ error: "unavailable" }, { status: 500 });
  }

  try {
    const transaction = await verifyAppleTransaction(data.signedTransactionInfo);
    const renewalInfo = data.signedRenewalInfo
      ? await verifyAppleRenewalInfo(data.signedRenewalInfo)
      : null;
    const result = await applyAppleTransaction(admin, transaction, {
      renewalInfo,
      signedDate: notification.signedDate ?? null,
    });
    if (!result.ok) {
      console.warn(
        "[apple-iap] notification not applied:",
        notification.notificationType,
        notification.subtype,
        result.reason
      );
      if (result.reason === "db_error") {
        return NextResponse.json({ error: "retry" }, { status: 500 });
      }
    }
  } catch (err) {
    console.error("[apple-iap] notification handling failed:", err);
    return NextResponse.json({ error: "retry" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
