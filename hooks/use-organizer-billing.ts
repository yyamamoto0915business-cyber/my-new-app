"use client";

import { useState, useEffect, useCallback } from "react";
import type { OrganizerBillingData } from "@/lib/organizer-billing-types";

export type { OrganizerBillingData };

export function useOrganizerBilling() {
  const [data, setData] = useState<OrganizerBillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBilling = useCallback(async () => {
    try {
      const res = await fetch("/api/organizer/billing");
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((d as { error?: string }).error ?? "取得に失敗しました");
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "課金情報を取得できませんでした");
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
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "エラー");
      if (json.url) window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラー");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "エラー");
      if (json.url) window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラー");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnectLoading(true);
    try {
      let res = await fetch("/api/connect/create-account", { method: "POST" });
      let json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "エラー");
      res = await fetch("/api/connect/onboard", { method: "POST" });
      json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "エラー");
      if (json.url) window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラー");
    } finally {
      setConnectLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    setError,
    refetch: fetchBilling,
    checkoutLoading,
    portalLoading,
    connectLoading,
    handleCheckout,
    handlePortal,
    handleConnect,
  };
}
