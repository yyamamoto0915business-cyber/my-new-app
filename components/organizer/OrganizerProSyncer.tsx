"use client";

import { useEffect } from "react";
import type { OrganizerCatalogPlanId } from "@/lib/organizer-plans";
import { setOrganizerNavPlan } from "@/lib/organizer-pro-store";

export function OrganizerProSyncer({ plan }: { plan: OrganizerCatalogPlanId | null }) {
  useEffect(() => {
    setOrganizerNavPlan(plan);
  }, [plan]);
  return null;
}
