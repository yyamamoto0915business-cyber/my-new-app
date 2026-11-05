"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { getLoginUrl } from "@/lib/auth-utils";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { formatEventScheduleLabel } from "@/lib/event-recurrence";
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
import {
  EventApplyConfirmSheet,
  type EventApplyConfirmInfo,
} from "@/components/events/detail/EventApplyConfirmSheet";
import { cn } from "@/lib/utils";
import type { EventAnswers } from "@/lib/event-questions";

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

function buildConfirmInfo(
  event: Event | EventPurchaseData,
  purchaseData: EventPurchaseData
): EventApplyConfirmInfo {
  const priceLabel =
    purchaseData.price === 0
      ? "無料"
      : `¥${Number(purchaseData.price).toLocaleString("ja-JP")}`;

  if (!isFullEvent(event)) {
    return { title: purchaseData.title, priceLabel };
  }

  const placeLabel =
    [event.location, event.address].filter(Boolean).join(" ") || null;

  return {
    title: event.title,
    dateLabel: formatEventScheduleLabel(
      event.date,
      event.startTime,
      event.endTime,
      event.recurrence ?? "none",
      event.recurrenceCount,
      event.endDate
    ),
    placeLabel,
    priceLabel: event.priceNote
      ? `${priceLabel}（${event.priceNote}）`
      : priceLabel,
  };
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
  const confirmInfo = useMemo(
    () => buildConfirmInfo(event, purchaseData),
    [event, purchaseData]
  );

  const [isPurchased, setIsPurchased] = useState(Boolean(isPurchasedProp));
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  /** 主催者が足した質問と、その答え */
  const questions = useMemo(
    () => (isFullEvent(event) ? event.applicationQuestions ?? [] : []),
    [event]
  );
  const [answers, setAnswers] = useState<EventAnswers>({});
  const [applyError, setApplyError] = useState<string | null>(null);

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

  const executePurchase = useCallback(async () => {
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
    // 答えのもれで断られたときは、直せるよう確認のカードを開いたままにする
    let keepOpen = false;
    try {
      if (onlineCheckout) {
        const res = await fetchWithTimeout("/api/stripe/checkout/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: purchaseData.id, answers }),
        });
        const j = await res.json();
        if (res.ok && j.url) {
          window.location.href = j.url;
          return;
        }
        if (j.code === "answers_required") {
          setApplyError(j.error);
          setConfirmOpen(true);
          keepOpen = true;
          return;
        }
        alert(j.error ?? "購入手続きに失敗しました");
        return;
      }

      if (participationMode === "required") {
        const res = await fetchWithTimeout(
          `/api/events/${purchaseData.id}/join`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answers }),
          }
        );
        if (res.ok) {
          setIsPurchased(true);
        } else {
          const j = await res.json();
          if (j.code === "answers_required") {
            setApplyError(j.error);
            keepOpen = true;
            return;
          }
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
      if (!keepOpen) setConfirmOpen(false);
    }
  }, [
    answers,
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

    // 無料申込は確認カードを挟む。主催者の質問があるときは、有料のオンライン決済でも先に答えてもらう
    const askQuestions = questions.length > 0 && user && participationMode === "required" && ctaState !== "purchased";
    if (
      askQuestions ||
      (ctaState === "free_apply" &&
        user &&
        !onlineCheckout &&
        participationMode === "required")
    ) {
      setApplyError(null);
      setConfirmOpen(true);
      return;
    }

    void executePurchase();
  }, [
    onPurchase,
    ctaState,
    user,
    onlineCheckout,
    participationMode,
    executePurchase,
    questions.length,
  ]);

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

      <EventApplyConfirmSheet
        open={confirmOpen}
        event={confirmInfo}
        confirming={loading}
        onCancel={() => {
          if (!loading) setConfirmOpen(false);
        }}
        onConfirm={() => {
          void executePurchase();
        }}
        questions={questions}
        answers={answers}
        onAnswersChange={setAnswers}
        error={applyError}
        checkout={onlineCheckout}
      />
    </div>
  );
}
