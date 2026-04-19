"use client";

import { useState, useEffect, useCallback } from "react";
import type { OrganizerBillingData } from "@/lib/organizer-billing-types";

export type { OrganizerBillingData };

/** Safari 等で HTML 応答に対して res.json() すると出るメッセージを平易にする */
function humanizeClientError(message: string): string {
  if (/The string did not match the expected pattern/i.test(message)) {
    return "サーバーからの応答を読み取れませんでした。画面を更新するか、しばらく経ってから再度お試しください。";
  }
  return message;
}

async function parseApiJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const hint = res.ok
      ? "サーバーからの応答が読み取れませんでした。"
      : `サーバーエラー (${res.status})。しばらく経ってから再度お試しください。`;
    throw new Error(hint);
  }
}

function getApiErrorMessage(
  payload: Record<string, unknown>,
  fallback: string
): string {
  const apiError = payload.error;
  if (typeof apiError === "string" && apiError.trim().length > 0) {
    return apiError;
  }
  return fallback;
}

export function useOrganizerBilling() {
  const [data, setData] = useState<OrganizerBillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [resetConnectLoading, setResetConnectLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBilling = useCallback(async () => {
    try {
      const res = await fetch("/api/organizer/billing");
      const d = await parseApiJson(res);
      if (!res.ok) {
        throw new Error(
          getApiErrorMessage(d, `課金情報の取得に失敗しました（${res.status}）`)
        );
      }
      setError(null);
      setData(d as unknown as OrganizerBillingData);
    } catch (e) {
      const raw = e instanceof Error ? e.message : "課金情報を取得できませんでした";
      setError(humanizeClientError(raw));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    if (params.get("checkout") === "success" || params.get("connected") === "1") {
      fetchBilling();
    }
  }, [fetchBilling]);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const json = await parseApiJson(res);
      if (!res.ok) {
        throw new Error(
          getApiErrorMessage(
            json,
            `決済ページの準備に失敗しました（${res.status}）`
          )
        );
      }
      const url = json.url as string | undefined;
      if (url) window.location.href = url;
    } catch (e) {
      const raw =
        e instanceof Error
          ? e.message
          : "決済ページの準備に失敗しました。時間をおいて再度お試しください。";
      setError(humanizeClientError(raw));
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const json = await parseApiJson(res);
      if (!res.ok) {
        throw new Error(
          getApiErrorMessage(
            json,
            `お支払い管理ページの起動に失敗しました（${res.status}）`
          )
        );
      }
      const url = json.url as string | undefined;
      if (url) window.location.href = url;
    } catch (e) {
      const raw =
        e instanceof Error
          ? e.message
          : "お支払い管理ページの起動に失敗しました。時間をおいて再度お試しください。";
      setError(humanizeClientError(raw));
    } finally {
      setPortalLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnectLoading(true);
    try {
      let res = await fetch("/api/connect/create-account", { method: "POST" });
      let json = await parseApiJson(res);
      if (!res.ok) {
        throw new Error(
          getApiErrorMessage(
            json,
            `Stripe連携アカウント作成に失敗しました（${res.status}）`
          )
        );
      }
      res = await fetch("/api/connect/onboard", { method: "POST" });
      json = await parseApiJson(res);
      if (!res.ok) {
        throw new Error(
          getApiErrorMessage(
            json,
            `Stripe初期設定ページの起動に失敗しました（${res.status}）`
          )
        );
      }
      const url = json.url as string | undefined;
      if (url) window.location.href = url;
    } catch (e) {
      const raw =
        e instanceof Error
          ? e.message
          : "Stripe連携の開始に失敗しました。時間をおいて再度お試しください。";
      setError(humanizeClientError(raw));
    } finally {
      setConnectLoading(false);
    }
  };

  const handleResetStripeConnect = useCallback(async () => {
    setResetConnectLoading(true);
    try {
      const res = await fetch("/api/connect/reset", { method: "POST" });
      const json = await parseApiJson(res);
      if (!res.ok) {
        throw new Error(
          getApiErrorMessage(
            json,
            `Stripe連携情報のリセットに失敗しました（${res.status}）`
          )
        );
      }
      setError(null);
      await fetchBilling();
    } catch (e) {
      const raw =
        e instanceof Error
          ? e.message
          : "Stripe連携情報のリセットに失敗しました。時間をおいて再度お試しください。";
      setError(humanizeClientError(raw));
    } finally {
      setResetConnectLoading(false);
    }
  }, [fetchBilling]);

  return {
    data,
    loading,
    error,
    setError,
    refetch: fetchBilling,
    checkoutLoading,
    portalLoading,
    connectLoading,
    resetConnectLoading,
    handleCheckout,
    handlePortal,
    handleConnect,
    handleResetStripeConnect,
  };
}
