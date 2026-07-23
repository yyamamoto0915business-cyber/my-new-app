"use client";

import { useEffect, useState } from "react";
import { formatEventScheduleLabel } from "@/lib/event-recurrence";
import type { EventRecurrence } from "@/lib/event-recurrence";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import {
  canPurchaseEvent,
  getRemainingCount,
  resolvePurchaseCtaState,
  toEventPurchaseData,
  type EventPurchaseData,
} from "@/lib/event-purchase";
import type { Event } from "@/lib/db/types";
import { EventBasicInfo } from "@/components/events/detail/purchase/EventBasicInfo";
import { EventPurchasePrimaryCta } from "@/components/events/detail/purchase/EventPurchasePrimaryCta";
import { PassAvailability } from "@/components/events/detail/purchase/PassAvailability";
import { EventPrimaryActions } from "@/components/events/detail/EventPrimaryActions";

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
  /** 申込不要時の参加予定CTA表示可否（終了・満員など） */
  isAvailable?: boolean;
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
  isAvailable = true,
}: Props) {
  const { user } = useSupabaseUser();
  const purchaseData = isFullEvent(event)
    ? toEventPurchaseData(event)
    : event;
  const participationMode = resolveParticipationMode(event);
  const fullEvent = isFullEvent(event) ? event : null;

  const [isPurchased, setIsPurchased] = useState(Boolean(isPurchasedProp));

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

      {participationMode === "required" ? (
        <>
          <div className="mt-4">
            <EventPurchasePrimaryCta
              event={event}
              isPurchased={isPurchased}
              onPurchase={onPurchase}
            />
          </div>
          <div className="mt-3">
            <PassAvailability
              remainingCount={remainingCount}
              salesEndAt={purchaseData.salesEndAt}
            />
          </div>
        </>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-center text-[12.5px] leading-snug text-[#9aa890]">
            事前申込は不要です。当日そのままご参加いただけます。
          </p>
          <EventPrimaryActions
            eventId={purchaseData.id}
            participationMode={participationMode}
            price={purchaseData.price}
            isAvailable={isAvailable}
            title={fullEvent?.title ?? ""}
            date={date}
            startTime={startTime}
            endTime={endTime}
            address={address ?? fullEvent?.address ?? ""}
            location={location}
            latitude={fullEvent?.latitude}
            longitude={fullEvent?.longitude}
            layout="sidebar"
            hideSave
            showOrganizerConsult
          />
        </div>
      )}
    </div>
  );
}
