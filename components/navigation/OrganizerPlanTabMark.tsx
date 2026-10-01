import type { OrganizerCatalogPlanId } from "@/lib/organizer-plans";
import { getOrganizerCatalogPlan } from "@/lib/organizer-plans";

export function OrganizerPlanTabBadge({ plan }: { plan: OrganizerCatalogPlanId }) {
  const name = getOrganizerCatalogPlan(plan).name;
  return <span className={`org-plan-tab-badge org-plan-tab-badge--${plan}`}>{name}</span>;
}

export function organizerPlanTabClass(plan: OrganizerCatalogPlanId) {
  return `org-tab-plan org-tab-plan--${plan}`;
}
