import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

/** 一覧系 API 用。ホームの 5 秒だと DB 待ちで空表示になりやすい */
export const LIST_FETCH_TIMEOUT_MS = 15_000;

type FetchJsonArrayResult<T> =
  | { ok: true; data: T[] }
  | { ok: false };

function shouldRetryStatus(status: number): boolean {
  return status === 499 || status === 503 || status >= 500;
}

/**
 * 配列 JSON を取得する。失敗・非配列は ok:false。
 * タイムアウト / 5xx は 1 回だけリトライする。
 */
export async function fetchJsonArray<T>(
  url: string,
  timeoutMs = LIST_FETCH_TIMEOUT_MS,
): Promise<FetchJsonArrayResult<T>> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetchWithTimeout(url, { cache: "no-store" }, timeoutMs);
      if (!res.ok) {
        if (attempt === 0 && shouldRetryStatus(res.status)) continue;
        return { ok: false };
      }
      const data: unknown = await res.json();
      if (!Array.isArray(data)) return { ok: false };
      return { ok: true, data: data as T[] };
    } catch {
      if (attempt === 0) continue;
      return { ok: false };
    }
  }
  return { ok: false };
}
