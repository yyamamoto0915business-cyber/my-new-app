import type { Event } from "./db/types";
import {
  type CategoryKey,
  CATEGORY_KEYS,
  TAG_TO_CATEGORY_KEY,
  CATEGORY_KEYWORDS,
} from "./categories";

function matchesKeyword(text: string, keywords: string[]): boolean {
  const normalized = text.toLowerCase();
  return keywords.some((kw) => normalized.includes(kw.toLowerCase()));
}

/**
 * イベントからカテゴリを推定する（優先順位に従う）
 * 優先1: event.tags から判定
 * 優先2: event.title + event.description のテキストから判定
 * 優先3: 何も当たらなければ []（未分類＝すべてに含める）
 */
export function inferCategoryKeys(event: Event): CategoryKey[] {
  const result: CategoryKey[] = [];

  // 優先1: tags から判定
  for (const tag of event.tags ?? []) {
    const cat = TAG_TO_CATEGORY_KEY[tag];
    if (cat && !result.includes(cat)) {
      result.push(cat);
    }
  }

  // 優先2: title + description のテキストから判定
  const text = [event.title, event.description ?? ""].join(" ");
  for (const key of CATEGORY_KEYS) {
    if (result.includes(key)) continue;
    const keywords = CATEGORY_KEYWORDS[key];
    if (matchesKeyword(text, keywords)) {
      result.push(key);
    }
  }

  return result;
}

/** 後方互換のため残す。内部キーを返すように変更 */
export function inferCategory(event: Event): CategoryKey[] {
  return inferCategoryKeys(event);
}

/** 表示用：推定カテゴリの先頭1つ（バッジ用） */
export function getPrimaryCategory(event: Event): CategoryKey | null {
  const keys = inferCategoryKeys(event);
  return keys[0] ?? null;
}

/** イベントが選択カテゴリに一致するか（OR: どれか一致で true。空=すべて） */
export function eventMatchesCategory(
  event: Event,
  selectedKeys: CategoryKey[]
): boolean {
  if (selectedKeys.length === 0) return true;
  const eventKeys = inferCategoryKeys(event);
  if (eventKeys.length === 0) return true; // 未分類は「すべて」に含める
  return selectedKeys.some((k) => eventKeys.includes(k));
}

/** カテゴリでフィルタ（OR で一致するもの） */
export function filterEventsByCategory(
  events: Event[],
  selectedKeys: CategoryKey[]
): Event[] {
  if (selectedKeys.length === 0) return events;
  return events.filter((e) => eventMatchesCategory(e, selectedKeys));
}
