const STORAGE_PREFIX = "mg-play:";

export type StoredPlaySession = {
  deviceToken: string;
  nickname: string;
};

export function playSessionStorageKey(joinToken: string): string {
  return `${STORAGE_PREFIX}${joinToken}`;
}

export function readPlaySession(joinToken: string): StoredPlaySession | null {
  if (typeof window === "undefined" || !joinToken) return null;
  try {
    const raw = window.localStorage.getItem(playSessionStorageKey(joinToken));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredPlaySession;
    if (!parsed?.deviceToken || !parsed?.nickname) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writePlaySession(joinToken: string, session: StoredPlaySession): void {
  if (typeof window === "undefined" || !joinToken) return;
  window.localStorage.setItem(playSessionStorageKey(joinToken), JSON.stringify(session));
}

export function clearPlaySession(joinToken: string): void {
  if (typeof window === "undefined" || !joinToken) return;
  window.localStorage.removeItem(playSessionStorageKey(joinToken));
}
