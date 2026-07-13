"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatEventScheduleLabel } from "@/lib/event-recurrence";
import type { EventRecurrence } from "@/lib/event-recurrence";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { getLoginUrl } from "@/lib/auth-utils";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import {
  canPurchaseEvent,
  getEventPassHref,
  getRemainingCount,
  resolvePurchaseCtaState,
  toEventPurchaseData,
  type EventPurchaseData,
} from "@/lib/event-purchase";
import type { Event } from "@/lib/db/types";
import { EventBasicInfo } from "@/components/events/detail/purchase/EventBasicInfo";
import { PurchaseButton } from "@/components/events/detail/purchase/PurchaseButton";
import { PassAvailability } from "@/components/events/detail/purchase/PassAvailability";

type DisplayProps = {
  date: string;
  startTime: string;
  endTime?: string;
  recurrence?: EventRecurrence;
  recurrenceCount?: number | null;
  location: string;
  address?: string;
  priceNote?: string | null;
  receptionLabel: string;
};

type Props = {
  event: Event | EventPurchaseData;
  isPurchased?: boolean;
  onPurchase?: () => void | Promise<void>;
} & DisplayProps;

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

export function EventPurchaseCard({
  event,
  isPurchased: isPurchasedProp,
  onPurchase,
  date,
  startTime,
  endTime,
  recurrence = "none",
  recurrenceCount,
  location,
  address,
  priceNote,
  receptionLabel,
}: Props) {
  const router = useRouter();
  const { user } = useSupabaseUser();
  const purchaseData = isFullEvent(event)
    ? toEventPurchaseData(event)
    : event;
  const participationMode = resolveParticipationMode(event);

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
  const remainingCount = getRemainingCount(
    purchaseData.capacity,
    purchaseData.soldCount
  );
  const purchaseable = canPurchaseEvent(purchaseData);

  const dateLine = formatEventScheduleLabel(
    date,
    startTime,
    endTime,
    recurrence,
    recurrenceCount
  );
  const priceLine =
    purchaseData.price === 0
      ? "無料"
      : `¥${Number(purchaseData.price).toLocaleString("ja-JP")}${
          priceNote ? `（${priceNote}）` : ""
        }`;

  const receptionActive =
    purchaseable &&
    !isPurchased &&
    ctaState !== "sold_out" &&
    ctaState !== "closed";
  const displayReception =
    receptionActive && (receptionLabel === "参加受付中" || !receptionLabel)
      ? "受付中"
      : receptionLabel;

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
      if (purchaseData.isPaid) {
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
        purchaseData.isPaid
          ? "購入手続きに失敗しました"
          : "申し込みに失敗しました"
      );
    } finally {
      setLoading(false);
    }
  }, [ctaState, participationMode, purchaseData, router, user]);

  const handleClick = useCallback(() => {
    if (onPurchase) {
      void onPurchase();
      return;
    }
    void defaultPurchase();
  }, [onPurchase, defaultPurchase]);

  const showHint = ctaState === "purchase" || ctaState === "free_apply";

  return (
    <div className="rounded-2xl border border-[#e8edd8] bg-white p-4">
      <p className="mb-3 text-[13px] font-bold text-[#1a2818]">
        イベントの基本情報
      </p>

      <EventBasicInfo
        dateLine={dateLine}
        location={location}
        address={address}
        priceLine={priceLine}
        receptionLabel={displayReception}
        receptionActive={receptionActive || displayReception === "受付中"}
      />

      <div className="mt-4 flex flex-col gap-2">
        <PurchaseButton
          state={ctaState}
          loading={loading}
          onClick={handleClick}
        />
        {showHint ? (
          <p className="text-center text-[12.5px] leading-snug text-[#9aa890]">
            {ctaState === "free_apply"
              ? "申込後、受付用QRコードが発行されます"
              : "購入後、受付用QRコードが発行されます"}
          </p>
        ) : null}
      </div>

      <div className="mt-3">
        <PassAvailability
          remainingCount={remainingCount}
          salesEndAt={purchaseData.salesEndAt}
        />
      </div>
    </div>
  );
}
