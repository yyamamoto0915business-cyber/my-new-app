"use client";

import { useEffect } from "react";
import type { PlayProgress, PlaySession } from "@/lib/organizer/play-types";
import { readPlaySession } from "@/lib/organizer/play-session";

/** 店で使用済みになったら、見せているコードを「使用済み」に切り替える。 */
export function useWatchCouponUse(
  joinToken: string,
  progress: PlayProgress | null,
  setProgress: (next: PlayProgress) => void,
) {
  const rewardCode = progress?.rewardCode;
  const rewardUsed = progress?.rewardUsed;
  useEffect(() => {
    if (!joinToken || !rewardCode || rewardUsed) return;
    let cancelled = false;
    const timer = window.setInterval(() => {
      const stored = readPlaySession(joinToken);
      if (!stored) return;
      void (async () => {
        try {
          const res = await fetch(`/api/play/${encodeURIComponent(joinToken)}/session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deviceToken: stored.deviceToken }),
          });
          if (!res.ok || cancelled) return;
          const session = (await res.json()) as PlaySession;
          if (!cancelled && session.progress?.rewardUsed) setProgress(session.progress);
        } catch {
          /* 次の確認で再試行する */
        }
      })();
    }, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [joinToken, rewardCode, rewardUsed, setProgress]);
}
