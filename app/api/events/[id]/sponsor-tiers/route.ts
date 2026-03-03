import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchSponsorTiersByEvent,
  fetchSponsorPurchasesByEvent,
  fetchSponsorApplicationsByEvent,
  getTotalSponsoredAmount,
  ensureDefaultTiers,
} from "@/lib/db/sponsors";
import {
  getSponsorPurchasesByEvent,
  getTotalAmountByEvent,
} from "@/lib/sponsor-purchases-store";
import {
  DEFAULT_INDIVIDUAL_TIERS,
  DEFAULT_COMPANY_TIERS,
} from "@/lib/sponsorDefaults";
import type { SponsorTier } from "@/lib/db/types";

function toFallbackTier(
  t: (typeof DEFAULT_INDIVIDUAL_TIERS)[0],
  i: number,
  prefix: string
): SponsorTier {
  return {
    id: `${prefix}-${i}`,
    eventId: "",
    type: t.type,
    price: t.price,
    name: t.name,
    description: t.description,
    benefits: t.benefits,
    sortOrder: t.sortOrder,
    isActive: true,
  };
}

const FALLBACK_INDIVIDUAL = DEFAULT_INDIVIDUAL_TIERS.map((t, i) =>
  toFallbackTier(t, i, "f-ind")
);
const FALLBACK_COMPANY = DEFAULT_COMPANY_TIERS.map((t, i) =>
  toFallbackTier(t, i, "f-cmp")
);

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { id: eventId } = await params;
  if (!eventId) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const supabase = await createClient();

  if (!supabase) {
    const localPurchases = getSponsorPurchasesByEvent(eventId);
    const localTotal = getTotalAmountByEvent(eventId);
    return NextResponse.json({
      tiers: {
        individual: FALLBACK_INDIVIDUAL.map((t) => ({ ...t, eventId })),
        company: FALLBACK_COMPANY.map((t) => ({ ...t, eventId })),
      },
      purchases: localPurchases,
      applications: [],
      totalAmount: localTotal,
    });
  }

  await ensureDefaultTiers(supabase, eventId);

  const [allTiers, purchases, applications, totalAmount] = await Promise.all([
    fetchSponsorTiersByEvent(supabase, eventId),
    fetchSponsorPurchasesByEvent(supabase, eventId),
    fetchSponsorApplicationsByEvent(supabase, eventId, "approved"),
    getTotalSponsoredAmount(supabase, eventId),
  ]);

  const individualTiers = allTiers.filter((t) => t.type === "individual");
  const companyTiers = allTiers.filter((t) => t.type === "company");

  const fallbackIndividual = individualTiers.length > 0 ? individualTiers : FALLBACK_INDIVIDUAL.map((t) => ({ ...t, eventId }));
  const fallbackCompany = companyTiers.length > 0 ? companyTiers : FALLBACK_COMPANY.map((t) => ({ ...t, eventId }));

  const localPurchases = getSponsorPurchasesByEvent(eventId);
  const localTotal = getTotalAmountByEvent(eventId);
  const mergedPurchases = [...purchases, ...localPurchases];
  const mergedTotal = totalAmount + localTotal;

  return NextResponse.json({
    tiers: { individual: fallbackIndividual, company: fallbackCompany },
    purchases: mergedPurchases,
    applications,
    totalAmount: mergedTotal,
  });
}
