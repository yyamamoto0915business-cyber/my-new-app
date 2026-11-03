"use client";

/**
 * iOS アプリの App 内課金（StoreKit 2 / @capgo/native-purchases）。
 * 購入・復元したら、Apple の署名つきデータをサーバーに送ってプランに反映する。
 * ブラウザや、課金プラグインが入る前のビルド（1.0 (3) 以前）では使えない。
 */
import {
  APPLE_ORGANIZER_PRODUCT_ID_LIST,
  APPLE_ORGANIZER_PRODUCT_IDS,
  appleProductIdToPlan,
  type OrganizerPaidPlan,
} from "@/lib/apple-iap/products";

export type AppleOrganizerProduct = {
  plan: OrganizerPaidPlan;
  productId: string;
  title: string;
  priceString: string;
};

async function loadPlugin() {
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable("NativePurchases")) {
    return null;
  }
  return import("@capgo/native-purchases");
}

/** このアプリで App 内課金が使えるか */
export async function isAppleIapAvailable(): Promise<boolean> {
  const mod = await loadPlugin().catch(() => null);
  if (!mod) return false;
  try {
    const { isBillingSupported } = await mod.NativePurchases.isBillingSupported();
    return isBillingSupported;
  } catch {
    return false;
  }
}

/** App Store に登録した主催者プランの名前と値段（その国の通貨で表示） */
export async function getAppleOrganizerProducts(): Promise<AppleOrganizerProduct[]> {
  const mod = await loadPlugin();
  if (!mod) return [];
  const { products } = await mod.NativePurchases.getProducts({
    productIdentifiers: APPLE_ORGANIZER_PRODUCT_ID_LIST,
    productType: mod.PURCHASE_TYPE.SUBS,
  });
  return products.flatMap((p) => {
    const plan = appleProductIdToPlan(p.identifier);
    return plan ? [{ plan, productId: p.identifier, title: p.title, priceString: p.priceString }] : [];
  });
}

async function sendToServer(signedTransactions: string[]): Promise<{ plan: string }> {
  const res = await fetch("/api/billing/apple/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ signedTransactions }),
  });
  const json = (await res.json().catch(() => ({}))) as { plan?: string; error?: string };
  if (!res.ok) throw new Error(json.error ?? "購入の確認に失敗しました。");
  return { plan: json.plan ?? "free" };
}

export class AppleIapCancelledError extends Error {}

function isUserCancel(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /cancel/i.test(message);
}

/**
 * プランを買う。appAccountToken にログイン中の user id を入れておくと、
 * 更新・解約の通知（サーバー通知）からも同じ主催者を見つけられる。
 */
export async function purchaseAppleOrganizerPlan(plan: OrganizerPaidPlan, userId: string) {
  const mod = await loadPlugin();
  if (!mod) throw new Error("このバージョンのアプリでは購入できません。アプリを最新にしてください。");
  let transaction;
  try {
    transaction = await mod.NativePurchases.purchaseProduct({
      productIdentifier: APPLE_ORGANIZER_PRODUCT_IDS[plan],
      productType: mod.PURCHASE_TYPE.SUBS,
      quantity: 1,
      appAccountToken: userId,
    });
  } catch (err) {
    if (isUserCancel(err)) throw new AppleIapCancelledError("cancelled");
    throw err;
  }
  if (!transaction.jwsRepresentation) {
    throw new Error("購入の情報を受け取れませんでした。「購入を復元」をお試しください。");
  }
  return sendToServer([transaction.jwsRepresentation]);
}

/** 以前の購入を復元して、サーバーに送り直す */
export async function restoreAppleOrganizerPlan(userId: string) {
  const mod = await loadPlugin();
  if (!mod) throw new Error("このバージョンのアプリでは復元できません。アプリを最新にしてください。");
  await mod.NativePurchases.restorePurchases().catch(() => undefined);
  const { purchases } = await mod.NativePurchases.getPurchases({
    productType: mod.PURCHASE_TYPE.SUBS,
    onlyCurrentEntitlements: true,
  });
  const signed = purchases
    .filter((p) => appleProductIdToPlan(p.productIdentifier))
    .filter((p) => !p.appAccountToken || p.appAccountToken === userId)
    .flatMap((p) => (p.jwsRepresentation ? [p.jwsRepresentation] : []));
  if (signed.length === 0) {
    throw new Error("復元できる購入が見つかりませんでした。");
  }
  return sendToServer(signed);
}

/** App Store のサブスクリプション管理画面（解約・プラン変更）を開く */
export async function openAppleSubscriptionManagement() {
  const mod = await loadPlugin();
  if (!mod) return;
  await mod.NativePurchases.manageSubscriptions();
}
