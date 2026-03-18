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
  } catch (err: unknown) {
    // タイムアウト時の AbortError は「ネットワークエラー」扱いとして、
    // ランタイム例外を投げずに擬似的なレスポンスを返す。
    // 各呼び出し元では status や ok を見てハンドリングするか、
    // そのまま json() を読んでも空オブジェクトになる。
    if (err instanceof Error && err.name === "AbortError") {
      return new Response("{}", {
        status: 499,
        statusText: "Client Timeout",
      });
    }
    throw err;
  } finally {
    clearTimeout(tid);
  }
}
