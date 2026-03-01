import type { Benefit } from "./volunteer-roles-mock";
import {
  BENEFIT_LABELS,
  BENEFIT_ORDER,
  VOLUNTEER_ROLE_LABELS,
} from "./volunteer-roles-mock";

export type VolunteerRoleWithEvent = {
  id: string;
  eventId: string;
  roleType: string;
  title: string;
  description: string;
  dateTime: string;
  location: string;
  capacity: number;
  perksText?: string;
  hasTransportSupport?: boolean;
  hasHonorarium?: boolean;
  benefits?: Benefit[];
  thumbnailUrl?: string;
  emergency?: { isEmergency?: boolean; urgencyLevel?: number; activeTo?: string };
  event?: { id: string; title: string; date: string; prefecture?: string } | null;
};

/** 既存データから benefits を解決（後方互換） */
export function resolveBenefits(r: VolunteerRoleWithEvent): Benefit[] {
  const fromBenefits = r.benefits ?? [];
  const fromLegacy: Benefit[] = [];
  if (r.hasTransportSupport) fromLegacy.push("TRANSPORT");
  if (r.hasHonorarium) fromLegacy.push("REWARD");
  const merged = [...new Set([...fromLegacy, ...fromBenefits])];
  return BENEFIT_ORDER.filter((b) => merged.includes(b));
}

/** 表示用 benefits（最大4つ、超過分は +n） */
export function getDisplayBenefits(r: VolunteerRoleWithEvent): {
  chips: { benefit: Benefit; label: string }[];
  overflowCount: number;
} {
  const all = resolveBenefits(r);
  const chips = all.slice(0, 4).map((b) => ({
    benefit: b,
    label: BENEFIT_LABELS[b],
  }));
  const overflowCount = Math.max(0, all.length - 4);
  return { chips, overflowCount };
}

export function getCategoryLabel(roleType: string): string {
  return VOLUNTEER_ROLE_LABELS[roleType as keyof typeof VOLUNTEER_ROLE_LABELS] ?? roleType;
}

export type BenefitFilter = Benefit | "EMERGENCY";

/** 緊急募集のソート（urgencyLevel降順 → activeTo近い → 新着） */
export function sortEmergencyRoles(
  roles: VolunteerRoleWithEvent[]
): VolunteerRoleWithEvent[] {
  return [...roles].sort((a, b) => {
    const uA = a.emergency?.urgencyLevel ?? 0;
    const uB = b.emergency?.urgencyLevel ?? 0;
    if (uB !== uA) return uB - uA;

    const activeA = a.emergency?.activeTo ?? "9999-12-31";
    const activeB = b.emergency?.activeTo ?? "9999-12-31";
    if (activeA !== activeB) return activeA.localeCompare(activeB);

    const createdA = "createdAt" in a ? String((a as { createdAt?: string }).createdAt) : "";
    const createdB = "createdAt" in b ? String((b as { createdAt?: string }).createdAt) : "";
    return createdB.localeCompare(createdA);
  });
}

export type VolunteerSort = "recommended" | "newest" | "soonest";

/** 通常募集のソート */
export function sortVolunteerRoles(
  roles: VolunteerRoleWithEvent[],
  sort: VolunteerSort
): VolunteerRoleWithEvent[] {
  return [...roles].sort((a, b) => {
    if (sort === "newest") {
      const createdA = (a as { createdAt?: string }).createdAt ?? "";
      const createdB = (b as { createdAt?: string }).createdAt ?? "";
      return createdB.localeCompare(createdA);
    }
    if (sort === "soonest") {
      const dateA = a.dateTime?.replace(/\D/g, "").slice(0, 8) ?? "99991231";
      const dateB = b.dateTime?.replace(/\D/g, "").slice(0, 8) ?? "99991231";
      return dateA.localeCompare(dateB);
    }
    return 0;
  });
}

/** クイックフィルター（待遇・緊急）で絞り込み */
export function filterByBenefit(
  roles: VolunteerRoleWithEvent[],
  benefit: BenefitFilter
): VolunteerRoleWithEvent[] {
  if (benefit === "EMERGENCY") {
    return roles.filter((r) => r.emergency?.isEmergency === true);
  }
  return roles.filter((r) => resolveBenefits(r).includes(benefit));
}
