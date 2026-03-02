import type { CategoryKey } from "./inferCategory";
import { CATEGORY_KEYS } from "./inferCategory";

const STORAGE_KEY = "mg_category_prefs";

function parse(str: string | null): CategoryKey[] {
  if (!str) return [];
  try {
    const arr = JSON.parse(str);
    if (!Array.isArray(arr)) return [];
    return arr.filter((x): x is CategoryKey =>
      typeof x === "string" && (CATEGORY_KEYS as readonly string[]).includes(x)
    );
  } catch {
    return [];
  }
}

export function getCategoryPrefs(): CategoryKey[] {
  if (typeof window === "undefined") return [];
  return parse(localStorage.getItem(STORAGE_KEY));
}

export function setCategoryPrefs(prefs: CategoryKey[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function toggleCategoryPref(cat: CategoryKey): CategoryKey[] {
  const current = getCategoryPrefs();
  const idx = current.indexOf(cat);
  const next =
    idx >= 0 ? current.filter((_, i) => i !== idx) : [...current, cat];
  setCategoryPrefs(next);
  return next;
}

export function clearCategoryPrefs(): CategoryKey[] {
  setCategoryPrefs([]);
  return [];
}
