"use client";

import { useCallback, useEffect, useState } from "react";
import type { OrganizerPaidPlan } from "@/lib/apple-iap/products";
import {
  AppleIapCancelledError,
  getAppleOrganizerProducts,
  isAppleIapAvailable,
  openAppleSubscriptionManagement,
  purchaseAppleOrganizerPlan,
  restoreAppleOrganizerPlan,
  type AppleOrganizerProduct,
} from "@/lib/native/iap";

/**
 * iOS アプリの App 内課金で主催者プランを買う・復元する。
 * enabled が false（ブラウザなど）のときは何もしない。
 */
export function useAppleIap(enabled: boolean, onChanged: () => Promise<void> | void) {
  const [available, setAvailable] = useState(false);
  const [products, setProducts] = useState<AppleOrganizerProduct[]>([]);
  const [busy, setBusy] = useState<OrganizerPaidPlan | "restore" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void (async () => {
      const ok = await isAppleIapAvailable();
      if (cancelled || !ok) return;
      setAvailable(true);
      try {
        const list = await getAppleOrganizerProducts();
        if (!cancelled) setProducts(list);
      } catch (err) {
        console.error("[apple-iap] products", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const productFor = useCallback(
    (plan: OrganizerPaidPlan) => products.find((p) => p.plan === plan) ?? null,
    [products]
  );

  const purchase = useCallback(
    async (plan: OrganizerPaidPlan, userId: string) => {
      setBusy(plan);
      setError(null);
      setMessage(null);
      try {
        await purchaseAppleOrganizerPlan(plan, userId);
        setMessage(`${plan === "game" ? "GAME" : "STANDARD"}プランのお申し込みが完了しました。`);
        await onChanged();
      } catch (err) {
        if (!(err instanceof AppleIapCancelledError)) {
          setError(err instanceof Error ? err.message : "お申し込みに失敗しました。");
        }
      } finally {
        setBusy(null);
      }
    },
    [onChanged]
  );

  const restore = useCallback(
    async (userId: string) => {
      setBusy("restore");
      setError(null);
      setMessage(null);
      try {
        await restoreAppleOrganizerPlan(userId);
        setMessage("購入を復元しました。");
        await onChanged();
      } catch (err) {
        setError(err instanceof Error ? err.message : "購入を復元できませんでした。");
      } finally {
        setBusy(null);
      }
    },
    [onChanged]
  );

  const manage = useCallback(() => {
    void openAppleSubscriptionManagement().catch(() => undefined);
  }, []);

  return { available, productFor, busy, error, message, purchase, restore, manage };
}
