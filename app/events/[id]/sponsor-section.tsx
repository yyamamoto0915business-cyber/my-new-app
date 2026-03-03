"use client";

import { useState, useEffect, useCallback } from "react";
import type { SponsorTier, SponsorPurchase, SponsorApplication } from "@/lib/db/types";
import { IndividualSupportSection } from "./individual-support-section";
import { CompanySponsorSection } from "./company-sponsor-section";
import { SponsorDisplaySection } from "./sponsor-display-section";

export type SponsorData = {
  tiers: { individual: SponsorTier[]; company: SponsorTier[] };
  purchases: SponsorPurchase[];
  applications: SponsorApplication[];
  totalAmount: number;
};

type Props = { eventId: string; goalAmount?: number };

export function SponsorSection({ eventId, goalAmount }: Props) {
  const [data, setData] = useState<SponsorData | null>(null);

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
    <>
      <IndividualSupportSection eventId={eventId} onPurchaseSuccess={refresh} />
      <CompanySponsorSection eventId={eventId} />
      <SponsorDisplaySection eventId={eventId} goalAmount={goalAmount} data={data} />
    </>
  );
}
