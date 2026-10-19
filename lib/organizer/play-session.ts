const STORAGE_PREFIX = "mg-play:";
/** 端末に残った参加情報を「プレイ中」として出す期間。 */
const ACTIVE_FOR_MS = 14 * 24 * 60 * 60 * 1000;
export const PLAY_SESSION_CHANGE_EVENT = "mg-play-session-change";

export type StoredPlaySession = {
  deviceToken: string;
  nickname: string;
  /** 通常画面の「ゲームに戻る」に出す名前と進捗。 */
  title?: string;
  stampedCount?: number;
  spotCount?: number;
  completed?: boolean;
  updatedAt?: number;
  /** 「ゲームに戻る」を閉じた時刻。これより後に進捗が動けば、また出す。 */
  dismissedAt?: number;
};

export type ActivePlaySession = StoredPlaySession & {
  joinToken: string;
  title: string;
  updatedAt: number;
};

export function playSessionStorageKey(joinToken: string): string {
  return `${STORAGE_PREFIX}${joinToken}`;
}

function parseSession(raw: string | null): StoredPlaySession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredPlaySession;
    if (!parsed?.deviceToken || !parsed?.nickname) return null;
    return parsed;
  } catch {
    return null;
  }
}

function notifyChange() {
  try {
    window.dispatchEvent(new Event(PLAY_SESSION_CHANGE_EVENT));
  } catch {
    /* 通知できなくても保存は済んでいる */
  }
}

export function readPlaySession(joinToken: string): StoredPlaySession | null {
  if (typeof window === "undefined" || !joinToken) return null;
  try {
    return parseSession(window.localStorage.getItem(playSessionStorageKey(joinToken)));
  } catch {
    return null;
  }
}

/** 参加情報を保存する。名前や進捗など、渡さなかった項目は前の値を残す。 */
export function writePlaySession(joinToken: string, session: Partial<StoredPlaySession>): void {
  if (typeof window === "undefined" || !joinToken) return;
  try {
    const current = readPlaySession(joinToken);
    const next = { ...current, ...session };
    if (!next.deviceToken || !next.nickname) return;
    window.localStorage.setItem(playSessionStorageKey(joinToken), JSON.stringify(next));
    notifyChange();
  } catch {
    /* 保存できない端末では、その場の参加だけ続ける */
  }
}

export function clearPlaySession(joinToken: string): void {
  if (typeof window === "undefined" || !joinToken) return;
  try {
    window.localStorage.removeItem(playSessionStorageKey(joinToken));
    notifyChange();
  } catch {
    /* 消せなくても次の参加で上書きされる */
  }
}

/** 通常画面に「ゲームに戻る」を出す、いちばん最近遊んだゲーム。古いものと、閉じたもの（includeDismissed なら残す）は除く。 */
export function readActivePlaySession(
  { includeDismissed = false }: { includeDismissed?: boolean } = {},
  now = Date.now(),
): ActivePlaySession | null {
  if (typeof window === "undefined") return null;
  let best: ActivePlaySession | null = null;
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key?.startsWith(STORAGE_PREFIX)) continue;
      const session = parseSession(window.localStorage.getItem(key));
      if (!session?.title || typeof session.updatedAt !== "number") continue;
      if (now - session.updatedAt > ACTIVE_FOR_MS) continue;
      if (!includeDismissed && session.dismissedAt && session.dismissedAt >= session.updatedAt) continue;
      if (!best || session.updatedAt > best.updatedAt) {
        best = {
          ...session,
          joinToken: key.slice(STORAGE_PREFIX.length),
          title: session.title,
          updatedAt: session.updatedAt,
        };
      }
    }
  } catch {
    return null;
  }
  return best;
}

export function dismissPlaySession(joinToken: string): void {
  writePlaySession(joinToken, { dismissedAt: Date.now() });
}
