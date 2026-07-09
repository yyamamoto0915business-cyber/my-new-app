export type MypageSummaryResponse = {
  profile?: {
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    region: string | null;
    isOrganizerRegistered: boolean;
  };
  counts?: {
    planned: number;
    interested: number;
  };
};

let inflight: Promise<MypageSummaryResponse | null> | null = null;

/** マイページ表示前にデータを先読み（ボトムナビのタップ直前など） */
export function prefetchMypageSummary(): Promise<MypageSummaryResponse | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!inflight) {
    inflight = fetch("/api/me/mypage-summary", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  }
  return inflight;
}

export function resetMypageSummaryPrefetch() {
  inflight = null;
}
