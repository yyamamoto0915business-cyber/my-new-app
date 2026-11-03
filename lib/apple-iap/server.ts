/**
 * App 内課金（StoreKit 2）の署名つきデータを検証し、主催者プランに反映する（サーバー専用）。
 * 有料かどうかは Stripe と同じ organizers.plan / subscription_status に書くので、
 * 既存の isPaidOrganizer などはそのまま効く。
 */
import {
  Environment,
  SignedDataVerifier,
  type JWSRenewalInfoDecodedPayload,
  type JWSTransactionDecodedPayload,
} from "@apple/app-store-server-library";
import type { SupabaseClient } from "@supabase/supabase-js";
import { APPLE_ROOT_CA_G2, APPLE_ROOT_CA_G3 } from "@/lib/apple-iap/root-certs";
import { planColumnForAppleProduct } from "@/lib/apple-iap/products";

export const APPLE_BUNDLE_ID = "jp.machiglyph.app";

const ROOT_CERTS = [APPLE_ROOT_CA_G3, APPLE_ROOT_CA_G2].map((b64) => Buffer.from(b64, "base64"));

let productionVerifier: SignedDataVerifier | null | undefined;
let sandboxVerifier: SignedDataVerifier | undefined;

/** 本番の検証には App Store Connect の「Apple ID」（数字）が必要 */
function getProductionVerifier(): SignedDataVerifier | null {
  if (productionVerifier !== undefined) return productionVerifier;
  const appAppleId = Number(process.env.APPLE_APP_APPLE_ID);
  productionVerifier = Number.isFinite(appAppleId) && appAppleId > 0
    ? new SignedDataVerifier(ROOT_CERTS, true, Environment.PRODUCTION, APPLE_BUNDLE_ID, appAppleId)
    : null;
  return productionVerifier;
}

/** TestFlight と App Review の購入はサンドボックス */
function getSandboxVerifier(): SignedDataVerifier {
  sandboxVerifier ??= new SignedDataVerifier(ROOT_CERTS, true, Environment.SANDBOX, APPLE_BUNDLE_ID);
  return sandboxVerifier;
}

/** 本番で検証し、だめならサンドボックスで検証する */
async function verifyWithEitherEnvironment<T>(
  run: (verifier: SignedDataVerifier) => Promise<T>
): Promise<T> {
  const production = getProductionVerifier();
  if (production) {
    try {
      return await run(production);
    } catch (productionError) {
      try {
        return await run(getSandboxVerifier());
      } catch {
        throw productionError;
      }
    }
  }
  return run(getSandboxVerifier());
}

export function verifyAppleTransaction(signedTransaction: string) {
  return verifyWithEitherEnvironment((v) => v.verifyAndDecodeTransaction(signedTransaction));
}

export function verifyAppleRenewalInfo(signedRenewalInfo: string) {
  return verifyWithEitherEnvironment((v) => v.verifyAndDecodeRenewalInfo(signedRenewalInfo));
}

export function verifyAppleNotification(signedPayload: string) {
  return verifyWithEitherEnvironment((v) => v.verifyAndDecodeNotification(signedPayload));
}

type AppleSubscriptionState = {
  plan: "free" | "starter" | "game";
  subscriptionStatus: "active" | "past_due" | "canceled";
  currentPeriodEnd: string | null;
};

/** 取引（と更新情報）から、今プランが有効かどうかを決める */
export function appleSubscriptionState(
  transaction: JWSTransactionDecodedPayload,
  renewalInfo?: JWSRenewalInfoDecodedPayload | null,
  now = Date.now()
): AppleSubscriptionState {
  const planColumn = planColumnForAppleProduct(transaction.productId);
  const expiresAt = transaction.expiresDate ?? null;
  const currentPeriodEnd = expiresAt ? new Date(expiresAt).toISOString() : null;

  if (!planColumn || transaction.revocationDate) {
    return { plan: "free", subscriptionStatus: "canceled", currentPeriodEnd };
  }
  if (expiresAt && expiresAt > now) {
    return { plan: planColumn, subscriptionStatus: "active", currentPeriodEnd };
  }
  // 支払いに失敗しても、猶予期間のあいだは使えるようにしておく
  const graceEnd = renewalInfo?.gracePeriodExpiresDate ?? null;
  if (graceEnd && graceEnd > now) {
    return { plan: planColumn, subscriptionStatus: "past_due", currentPeriodEnd };
  }
  return { plan: "free", subscriptionStatus: "canceled", currentPeriodEnd };
}

type OrganizerRow = {
  id: string;
  profile_id: string;
  subscription_status: string | null;
  subscription_provider: string | null;
  stripe_subscription_id: string | null;
  apple_original_transaction_id: string | null;
  apple_signed_at: string | null;
};

const ORGANIZER_COLUMNS =
  "id, profile_id, subscription_status, subscription_provider, stripe_subscription_id, apple_original_transaction_id, apple_signed_at";

const STRIPE_PAID_STATUSES = ["active", "trialing", "past_due"];

/** Stripe で有料契約中か（Apple で二重に払わせないため） */
export function hasActiveStripeSubscription(organizer: {
  subscription_provider?: string | null;
  stripe_subscription_id?: string | null;
  subscription_status?: string | null;
}): boolean {
  return (
    organizer.subscription_provider !== "apple" &&
    Boolean(organizer.stripe_subscription_id) &&
    STRIPE_PAID_STATUSES.includes(organizer.subscription_status ?? "")
  );
}

/** appAccountToken（= 購入した人の user id）か、最初の取引 ID から主催者を探す */
async function findOrganizerForTransaction(
  admin: SupabaseClient,
  transaction: JWSTransactionDecodedPayload,
  expectedProfileId?: string
): Promise<OrganizerRow | null> {
  const profileId = expectedProfileId ?? transaction.appAccountToken ?? null;
  if (profileId) {
    const { data } = await admin
      .from("organizers")
      .select(ORGANIZER_COLUMNS)
      .eq("profile_id", profileId)
      .maybeSingle();
    if (data) return data as OrganizerRow;
  }
  if (transaction.originalTransactionId) {
    const { data } = await admin
      .from("organizers")
      .select(ORGANIZER_COLUMNS)
      .eq("apple_original_transaction_id", transaction.originalTransactionId)
      .maybeSingle();
    if (data) return data as OrganizerRow;
  }
  return null;
}

export type ApplyAppleResult =
  | { ok: true; organizerId: string; plan: AppleSubscriptionState["plan"]; skipped?: "stale" }
  | { ok: false; reason: "not_found" | "token_mismatch" | "stripe_active" | "wrong_bundle" | "db_error" };

/**
 * 検証済みの取引を主催者に反映する。
 * expectedProfileId を渡したとき（アプリからの購入直後）は、購入した人と一致するか確かめる。
 */
export async function applyAppleTransaction(
  admin: SupabaseClient,
  transaction: JWSTransactionDecodedPayload,
  options: {
    renewalInfo?: JWSRenewalInfoDecodedPayload | null;
    expectedProfileId?: string;
    signedDate?: number | null;
  } = {}
): Promise<ApplyAppleResult> {
  if (transaction.bundleId !== APPLE_BUNDLE_ID) return { ok: false, reason: "wrong_bundle" };

  const { expectedProfileId } = options;
  if (expectedProfileId && transaction.appAccountToken && transaction.appAccountToken !== expectedProfileId) {
    return { ok: false, reason: "token_mismatch" };
  }

  const organizer = await findOrganizerForTransaction(admin, transaction, expectedProfileId);
  if (!organizer) return { ok: false, reason: "not_found" };

  // 別の Apple ID の購入で、すでに別の主催者に結びついているものは引き継がない
  if (
    organizer.apple_original_transaction_id &&
    transaction.originalTransactionId &&
    organizer.apple_original_transaction_id !== transaction.originalTransactionId &&
    organizer.subscription_provider === "apple" &&
    organizer.subscription_status === "active" &&
    !expectedProfileId
  ) {
    return { ok: true, organizerId: organizer.id, plan: "free", skipped: "stale" };
  }

  if (hasActiveStripeSubscription(organizer)) {
    return { ok: false, reason: "stripe_active" };
  }

  // 通知は順番どおりに届くとは限らないので、古いものでは上書きしない
  const signedAt = options.signedDate ?? transaction.signedDate ?? null;
  if (signedAt && organizer.apple_signed_at && new Date(organizer.apple_signed_at).getTime() > signedAt) {
    return { ok: true, organizerId: organizer.id, plan: "free", skipped: "stale" };
  }

  const state = appleSubscriptionState(transaction, options.renewalInfo);
  const { error } = await admin
    .from("organizers")
    .update({
      plan: state.plan,
      subscription_status: state.subscriptionStatus,
      current_period_end: state.currentPeriodEnd,
      subscription_provider: "apple",
      apple_original_transaction_id: transaction.originalTransactionId ?? null,
      apple_product_id: transaction.productId ?? null,
      apple_environment: transaction.environment ?? null,
      apple_signed_at: signedAt ? new Date(signedAt).toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", organizer.id);

  if (error) {
    console.error("[apple-iap] organizer update failed:", error.message);
    return { ok: false, reason: "db_error" };
  }
  return { ok: true, organizerId: organizer.id, plan: state.plan };
}
