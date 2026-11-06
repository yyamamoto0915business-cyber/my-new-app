import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getApiUser } from "@/lib/api-auth";
import { getStripe } from "@/lib/stripe";
import { CHAT_MEDIA_BUCKET } from "@/lib/chat/chat-photos";

export const runtime = "nodejs";

/**
 * DELETE: ログイン中のアカウントを削除する。
 * auth.users を消すと profiles 以下は ON DELETE CASCADE で連動する。
 */
export async function DELETE() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "アカウントを削除できませんでした。時間をおいて再度お試しください。" },
      { status: 503 }
    );
  }

  const { data: organizer } = await admin
    .from("organizers")
    .select("stripe_subscription_id")
    .eq("profile_id", user.id)
    .maybeSingle();

  const subscriptionId = organizer?.stripe_subscription_id;
  if (typeof subscriptionId === "string" && subscriptionId.length > 0) {
    const stripe = getStripe();
    if (stripe) {
      try {
        await stripe.subscriptions.cancel(subscriptionId);
      } catch (err) {
        console.error("[account-delete] stripe cancel", err);
      }
    }
  }

  // チャットで送った写真の場所を、消す前に控えておく（メッセージは退会で一緒に消える）
  const { data: photoRows } = await admin
    .from("messages")
    .select("image_path")
    .eq("sender_id", user.id)
    .not("image_path", "is", null)
    .limit(5000);
  const photoPaths = (photoRows ?? [])
    .map((r) => (r as { image_path: string | null }).image_path)
    .filter((p): p is string => !!p);

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[account-delete]", error);
    return NextResponse.json(
      { error: "アカウントを削除できませんでした。時間をおいて再度お試しください。" },
      { status: 500 }
    );
  }

  // 退会が済んでから写真を消す（失敗しても退会そのものは成功として返す）
  for (let i = 0; i < photoPaths.length; i += 100) {
    const { error: removeError } = await admin.storage
      .from(CHAT_MEDIA_BUCKET)
      .remove(photoPaths.slice(i, i + 100));
    if (removeError) console.error("[account-delete] chat photos", removeError.message);
  }

  const supabase = await createClient();
  if (supabase) {
    await supabase.auth.signOut();
  }

  return NextResponse.json({ ok: true });
}
