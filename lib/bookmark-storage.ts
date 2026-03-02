const MAX_ITEMS = 50;
const BOOKMARKS_KEY = "mg_bookmarks";
const RECENT_KEY = "mg_recent";

function parseIds(json: string | null): string[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function saveIds(key: string, ids: string[]) {
  const trimmed = ids.slice(0, MAX_ITEMS);
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(trimmed));
  }
}

export function getBookmarks(): string[] {
  if (typeof window === "undefined") return [];
  return parseIds(localStorage.getItem(BOOKMARKS_KEY));
}

export function getRecent(): string[] {
  if (typeof window === "undefined") return [];
  return parseIds(localStorage.getItem(RECENT_KEY));
}

export function toggleBookmark(eventId: string): boolean {
  const ids = getBookmarks();
  const idx = ids.indexOf(eventId);
  const next = idx >= 0 ? ids.filter((_, i) => i !== idx) : [...ids, eventId];
  saveIds(BOOKMARKS_KEY, next);
  return idx < 0; // now saved
}

export function isBookmarked(eventId: string): boolean {
  return getBookmarks().includes(eventId);
}

export function addToRecent(eventId: string): void {
  const ids = getRecent();
  const filtered = ids.filter((id) => id !== eventId);
  saveIds(RECENT_KEY, [eventId, ...filtered]);
}
