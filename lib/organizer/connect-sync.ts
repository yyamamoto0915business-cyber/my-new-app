import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export type ConnectFlags = { chargesEnabled: boolean; detailsSubmitted: boolean };

/** Stripe のアカウントの状態を、主催者の行に書く（変わったときだけ）。通知（account.updated）と予備の確認の両方から使う。 */
export async function writeConnectFlags(
  db: SupabaseClient,
  stripeAccountId: string,
  account: Pick<Stripe.Account, "charges_enabled" | "details_submitted">,
): Promise<void> {
  await db
    .from("organizers")
    .update({
      stripe_account_charges_enabled: account.charges_enabled ?? false,
      stripe_account_details_submitted: account.details_submitted ?? false,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_account_id", stripeAccountId);
}

/**
 * 予備の確認：受け取り設定がまだ済んでいない記録のときだけ、Stripe に今の状態を聞いて書き直す。
 * 設定を終えて戻ってきたのに、通知が届いていない・遅れているときでも使えるようにするため。
 * 失敗しても今の記録のまま返す（画面や会計は止めない）。
 */
export async function refreshConnectFlagsIfPending(organizer: {
  stripe_account_id?: string | null;
  stripe_account_charges_enabled?: boolean | null;
  stripe_account_details_submitted?: boolean | null;
}): Promise<ConnectFlags> {
  const current: ConnectFlags = {
    chargesEnabled: organizer.stripe_account_charges_enabled === true,
    detailsSubmitted: organizer.stripe_account_details_submitted === true,
  };
  const accountId = organizer.stripe_account_id;
  if (!accountId || current.chargesEnabled) return current;
  const stripe = getStripe();
  const admin = createAdminClient();
  if (!stripe || !admin) return current;
  try {
    const account = await stripe.accounts.retrieve(accountId);
    const next: ConnectFlags = {
      chargesEnabled: account.charges_enabled === true,
      detailsSubmitted: account.details_submitted === true,
    };
    if (next.chargesEnabled !== current.chargesEnabled || next.detailsSubmitted !== current.detailsSubmitted) {
      await writeConnectFlags(admin, accountId, account);
    }
    return next;
  } catch (e) {
    console.error("connect refresh:", e instanceof Error ? e.message : e);
    return current;
  }
}
