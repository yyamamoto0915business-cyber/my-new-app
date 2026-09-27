import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getApiUser } from "@/lib/api-auth";
import { getStripe } from "@/lib/stripe";

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

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[account-delete]", error);
    return NextResponse.json(
      { error: "アカウントを削除できませんでした。時間をおいて再度お試しください。" },
      { status: 500 }
    );
  }

  const supabase = await createClient();
  if (supabase) {
    await supabase.auth.signOut();
  }

  return NextResponse.json({ ok: true });
}
