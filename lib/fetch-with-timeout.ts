import { isAbortLikeError, isNetworkFetchError } from "@/lib/is-abort-like-error";

/** タイムアウト付きfetch（5秒） */
const DEFAULT_TIMEOUT_MS = 5_000;

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
    // タイムアウト/中断/一時的なネットワーク障害時は例外を投げず、
    // 呼び出し元が status / ok で扱える擬似レスポンスを返す。
    if (
      isAbortLikeError(err) ||
      err instanceof FetchTimeoutError ||
      isNetworkFetchError(err)
    ) {
      return new Response("{}", {
        status: isNetworkFetchError(err) ? 503 : 499,
        statusText: isNetworkFetchError(err) ? "Network Error" : "Client Timeout",
      });
    }
    throw err;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
