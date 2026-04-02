/** タイムアウト付きfetch（10秒） */
const DEFAULT_TIMEOUT_MS = 10_000;

class FetchTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FetchTimeoutError";
  }
}

export async function fetchWithTimeout(
  url: string,
  options?: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new FetchTimeoutError(`Request timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    const res = await Promise.race([
      fetch(url, options),
      timeoutPromise,
    ]);
    return res;
  } catch (err: unknown) {
    // タイムアウト/中断時は「ネットワークエラー」扱いとして、
    // ランタイム例外を投げずに擬似的なレスポンスを返す。
    // 各呼び出し元では status や ok を見てハンドリングするか、
    // そのまま json() を読んでも空オブジェクトになる。
    const isAbortLike =
      (err instanceof DOMException && err.name === "AbortError") ||
      (err instanceof FetchTimeoutError) ||
      (err instanceof Error &&
        (err.name === "AbortError" ||
          err.name === "FetchTimeoutError" ||
          /aborted/i.test(err.message) ||
          /operation was aborted/i.test(err.message) ||
          /timed out/i.test(err.message))) ||
      (typeof err === "object" &&
        err != null &&
        "name" in err &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (String((err as any).name) === "AbortError" ||
          String((err as any).name) === "FetchTimeoutError"));

    if (isAbortLike) {
      return new Response("{}", {
        status: 499,
        statusText: "Client Timeout",
      });
    }
    throw err;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
