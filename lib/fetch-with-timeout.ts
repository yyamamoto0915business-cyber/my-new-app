/** タイムアウト付きfetch（10秒） */
const DEFAULT_TIMEOUT_MS = 10_000;

export async function fetchWithTimeout(
  url: string,
  options?: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(tid);
  }
}
