import type { MypageSummaryResponse } from "@/lib/mypage-summary-types";

export type { MypageSummaryResponse } from "@/lib/mypage-summary-types";

let inflight: Promise<MypageSummaryResponse | null> | null = null;

/** マイページ表示前にデータを先読み（ボトムナビのタップ直前など） */
export function prefetchMypageSummary(): Promise<MypageSummaryResponse | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!inflight) {
    inflight = fetch("/api/me/mypage-summary", { credentials: "include" })
      .then((r) => (r.ok ? (r.json() as Promise<MypageSummaryResponse>) : null))
      .catch(() => null);
  }
  return inflight;
}

export function resetMypageSummaryPrefetch() {
  inflight = null;
}
