import type { CategoryKey } from "@/lib/categories";
import type { Event } from "@/lib/db/types";
import type { OrganizerPublicInfo } from "@/lib/db/organizers";
import { inferCategoryKeys } from "@/lib/inferCategory";

const SHORT_BIO_MAX = 120;

export function truncateShortBio(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= SHORT_BIO_MAX) return trimmed;
  return `${trimmed.slice(0, SHORT_BIO_MAX - 1)}…`;
}

/** 主催イベントからジャンルを推定（プロフィール未設定時のフォールバック） */
export function inferOrganizerCategories(
  profileCategories: CategoryKey[],
  events: Event[]
): CategoryKey[] {
  if (profileCategories.length > 0) return profileCategories;

  const inferred = new Set<CategoryKey>();
  for (const event of events) {
    for (const key of inferCategoryKeys(event)) {
      inferred.add(key);
      if (inferred.size >= 4) break;
    }
    if (inferred.size >= 4) break;
  }
  return [...inferred];
}

export function formatOrganizerActivityStart(createdAt: string | null): string | null {
  if (!createdAt) return null;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

export type OrganizerProfileDisplay = {
  heroBio: string | null;
  aboutBio: string | null;
  activityArea: string | null;
  categories: CategoryKey[];
  activityStartedAt: string | null;
};

export function buildOrganizerProfileDisplay(
  organizer: OrganizerPublicInfo,
  events: Event[],
  createdAt: string | null
): OrganizerProfileDisplay {
  const categories = inferOrganizerCategories(organizer.categories, events);
  const rawBio = organizer.bio?.trim() || null;
  const rawShort = organizer.shortBio?.trim() || null;

  const heroBio = rawShort ?? (rawBio ? truncateShortBio(rawBio) : null);

  let aboutBio: string | null = null;
  if (rawBio) {
    if (!rawShort || rawBio !== rawShort || rawBio.length > SHORT_BIO_MAX) {
      aboutBio = rawBio;
    }
  } else if (rawShort && rawShort !== heroBio) {
    aboutBio = rawShort;
  }

  return {
    heroBio,
    aboutBio,
    activityArea: organizer.activityArea,
    categories,
    activityStartedAt: formatOrganizerActivityStart(createdAt),
  };
}

export { SHORT_BIO_MAX };
