"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { getLoginUrl } from "@/lib/auth-utils";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import {
  getEventPassHref,
  getPurchaseCtaHint,
  getPurchaseCtaLabel,
  isPurchaseCtaDisabled,
  requiresOnlineCheckout,
  resolvePurchaseCtaState,
  toEventPurchaseData,
  type EventPurchaseData,
} from "@/lib/event-purchase";
import type { Event } from "@/lib/db/types";
import { PurchaseButton } from "@/components/events/detail/purchase/PurchaseButton";
import { cn } from "@/lib/utils";

type Props = {
  event: Event | EventPurchaseData;
  isPurchased?: boolean;
  onPurchase?: () => void | Promise<void>;
  /** モバイル本体用のボタンスタイル */
  variant?: "default" | "mobile";
  className?: string;
  showHint?: boolean;
};

function isFullEvent(event: Event | EventPurchaseData): event is Event {
  return "date" in event && "startTime" in event && "location" in event;
}

function resolveParticipationMode(
  event: Event | EventPurchaseData
): "required" | "optional" | "none" {
  if (!isFullEvent(event)) return "required";
  return (
    event.participationMode ??
    (event.requiresRegistration ? "required" : "none")
  );
}

export function EventPurchasePrimaryCta({
  event,
  isPurchased: isPurchasedProp,
  onPurchase,
  variant = "default",
  className,
  showHint = true,
}: Props) {
  const router = useRouter();
  const { user } = useSupabaseUser();
  const purchaseData = isFullEvent(event)
    ? toEventPurchaseData(event)
    : event;
  const participationMode = resolveParticipationMode(event);
  const onlineCheckout = requiresOnlineCheckout(purchaseData);

  const [isPurchased, setIsPurchased] = useState(Boolean(isPurchasedProp));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof isPurchasedProp === "boolean") {
      setIsPurchased(isPurchasedProp);
    }
  }, [isPurchasedProp]);

  useEffect(() => {
    if (typeof isPurchasedProp === "boolean") return;
    if (!user) {
      setIsPurchased(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        if (participationMode === "required" || purchaseData.isPaid) {
          const res = await fetchWithTimeout(
            `/api/events/${purchaseData.id}/join`,
            { cache: "no-store" }
          );
          const d = await res.json();
          if (!cancelled) setIsPurchased(Boolean(d.applied));
          return;
        }
        const res = await fetchWithTimeout(
          `/api/events/${purchaseData.id}/reactions`,
          { cache: "no-store" }
        );
        const d = await res.json();
        if (!cancelled) setIsPurchased(d.myReaction === "planned");
      } catch {
        /* ignore */
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [
    user,
    purchaseData.id,
    purchaseData.isPaid,
    participationMode,
    isPurchasedProp,
  ]);

  const ctaState = resolvePurchaseCtaState({
    event: purchaseData,
    isPurchased,
  });
  const hint = showHint ? getPurchaseCtaHint(ctaState, purchaseData) : null;
  const label = loading ? "処理中..." : getPurchaseCtaLabel(ctaState);
  const disabled = isPurchaseCtaDisabled(ctaState) || loading;

  const defaultPurchase = useCallback(async () => {
    if (ctaState === "purchased") {
      if (purchaseData.isPaid || participationMode === "required") {
        router.push(getEventPassHref(purchaseData.id));
      } else {
        router.push("/profile/events/planned");
      }
      return;
    }

    if (!user) {
      window.location.href = getLoginUrl(`/events/${purchaseData.id}`);
      return;
    }

    setLoading(true);
    try {
      if (onlineCheckout) {
        const res = await fetchWithTimeout("/api/stripe/checkout/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: purchaseData.id }),
        });
        const j = await res.json();
        if (res.ok && j.url) {
          window.location.href = j.url;
          return;
        }
        alert(j.error ?? "購入手続きに失敗しました");
        return;
      }

      if (participationMode === "required") {
        const res = await fetchWithTimeout(
          `/api/events/${purchaseData.id}/join`,
          { method: "POST" }
        );
        if (res.ok) {
          setIsPurchased(true);
        } else {
          const j = await res.json();
          alert(j.error ?? "申し込みに失敗しました");
        }
        return;
      }

      const res = await fetchWithTimeout(
        `/api/events/${purchaseData.id}/reactions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "planned" }),
        }
      );
      if (res.ok) {
        setIsPurchased(true);
      } else {
        const j = await res.json();
        alert(j.error ?? "申し込みに失敗しました");
      }
    } catch {
      alert(
        onlineCheckout ? "購入手続きに失敗しました" : "申し込みに失敗しました"
      );
    } finally {
      setLoading(false);
    }
  }, [
    ctaState,
    onlineCheckout,
    participationMode,
    purchaseData,
    router,
    user,
  ]);

  const handleClick = useCallback(() => {
    if (onPurchase) {
      void onPurchase();
      return;
    }
    void defaultPurchase();
  }, [onPurchase, defaultPurchase]);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {variant === "mobile" ? (
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className="ed-btn-primary flex min-h-[48px] w-full items-center justify-center gap-2 px-4 text-[15px] disabled:opacity-50"
        >
          {label}
        </button>
      ) : (
        <PurchaseButton
          state={ctaState}
          loading={loading}
          onClick={handleClick}
        />
      )}
      {hint ? (
        <p className="text-center text-[12.5px] leading-snug text-[#9aa890]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
