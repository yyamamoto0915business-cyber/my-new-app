import type { Event } from "./db/types";
import type { CategoryKey } from "./categories";
import { filterEventsByRegion } from "./events";
import { filterEventsByCategory, eventMatchesCategory } from "./inferCategory";
import { getRecommendedEvents } from "./events";

/**
 * おすすめヒーロー用の絞り込み（0件にならないようフォールバック）
 * 1) マイエリア AND カテゴリ一致
 * 2) マイエリアのみ
 * 3) カテゴリのみ
 * 4) 全体おすすめ
 */
export function getHeroEventsWithFallback(
  events: Event[],
  areaPreference: string,
  selectedCategoryKeys: CategoryKey[],
  limit: number
): Event[] {
  const usedIds = new Set<string>();
  const result: Event[] = [];

  const hasArea = areaPreference.trim().length > 0;
  const hasCategory = selectedCategoryKeys.length > 0;

  const addUpTo = (source: Event[], max: number) => {
    const available = source.filter((e) => !usedIds.has(e.id));
    const take = getRecommendedEvents(available, max);
    take.forEach((e) => usedIds.add(e.id));
    return take;
  };

  if (hasArea && hasCategory) {
    const byArea = filterEventsByRegion(events, areaPreference);
    const byAreaAndCat = byArea.filter((e) =>
      eventMatchesCategory(e, selectedCategoryKeys)
    );
    result.push(...addUpTo(byAreaAndCat, limit));
  }
  if (result.length < limit && hasArea) {
    const byArea = filterEventsByRegion(events, areaPreference);
    result.push(...addUpTo(byArea, limit - result.length));
  }
  if (result.length < limit && hasCategory) {
    const byCat = filterEventsByCategory(events, selectedCategoryKeys);
    result.push(...addUpTo(byCat, limit - result.length));
  }
  if (result.length < limit) {
    result.push(...addUpTo(events, limit - result.length));
  }

  return result.slice(0, limit);
}

/** ヒーロー1枚＋小カード最大2枚用（先頭を主役に） */
export function getHeroWithSubCards(
  events: Event[],
  areaPreference: string,
  selectedCategoryKeys: CategoryKey[],
  limit: number
): { featured: Event | null; subCards: Event[] } {
  const all = getHeroEventsWithFallback(
    events,
    areaPreference,
    selectedCategoryKeys,
    Math.min(limit + 1, 4)
  );
  const [featured, ...sub] = all;
  return {
    featured: featured ?? null,
    subCards: sub.slice(0, 2),
  };
}
