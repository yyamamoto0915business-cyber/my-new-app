/** ページ遷移・HMR・タイムアウト等で fetch が中断されたときのエラー判定 */
export function isAbortLikeError(err: unknown): boolean {
  if (err instanceof DOMException && err.name === "AbortError") return true;
  if (err instanceof Error) {
    return (
      err.name === "AbortError" ||
      err.name === "FetchTimeoutError" ||
      /aborted/i.test(err.message) ||
      /operation was aborted/i.test(err.message) ||
      /timed out/i.test(err.message)
    );
  }
  if (typeof err === "object" && err !== null && "name" in err) {
    const name = String((err as { name?: unknown }).name);
    return name === "AbortError" || name === "FetchTimeoutError";
  }
  return false;
}

/** オフライン・DNS 失敗など、一時的なネットワークエラー */
export function isNetworkFetchError(err: unknown): boolean {
  if (!(err instanceof TypeError)) return false;
  const msg = err.message.toLowerCase();
  return msg === "load failed" || msg === "fetch failed" || msg.includes("network");
}
