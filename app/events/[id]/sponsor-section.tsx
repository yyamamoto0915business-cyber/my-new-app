"use client";

import { useState, useEffect, useCallback } from "react";
import type { SponsorTier, SponsorPurchase, SponsorApplication } from "@/lib/db/types";
import { IndividualSupportSection } from "./individual-support-section";
import { CompanySponsorSection } from "./company-sponsor-section";
import { SponsorshipCheckoutSection } from "./sponsorship-checkout-section";
import { SponsorDisplaySection } from "./sponsor-display-section";

export type SponsorData = {
  tiers: { individual: SponsorTier[]; company: SponsorTier[] };
  purchases: SponsorPurchase[];
  applications: SponsorApplication[];
  totalAmount: number;
};

type Props = { eventId: string; goalAmount?: number };

/** 応援セクション：ページ下部に配置し、やわらかい表現で折りたたみ可能に */
export function SponsorSection({ eventId, goalAmount }: Props) {
  const [data, setData] = useState<SponsorData | null>(null);
  const [expanded, setExpanded] = useState(false);

  const refresh = useCallback(() => {
    fetch(`/api/events/${eventId}/sponsor-tiers`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, [eventId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <section className="mt-8 border-t border-[var(--mg-line)] pt-6">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <h2 className="text-sm font-medium text-[var(--mg-muted)]">
          このイベントを応援する
        </h2>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 text-[var(--mg-muted)] transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="mt-4 space-y-6">
          <p className="text-xs text-[var(--mg-muted)]">
            主催者や地域の活動を支援したい方は、こちらから応援できます。
          </p>
          <IndividualSupportSection eventId={eventId} onPurchaseSuccess={refresh} />
          <CompanySponsorSection eventId={eventId} />
          <SponsorshipCheckoutSection eventId={eventId} />
          <SponsorDisplaySection eventId={eventId} goalAmount={goalAmount} data={data} />
        </div>
      )}
    </section>
  );
}
