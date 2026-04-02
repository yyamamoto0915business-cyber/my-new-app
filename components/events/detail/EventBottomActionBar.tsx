"use client";

import { useCallback, useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { isBookmarked, toggleBookmark } from "@/lib/bookmark-storage";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { getLoginUrl } from "@/lib/auth-utils";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import {
  MOBILE_BOTTOM_NAV_CLEARANCE_PX,
  MOBILE_EVENT_BOTTOM_ACTION_BAR_PX,
} from "./layout-constants";

type ParticipationMode = "required" | "optional" | "none";

type Props = {
  eventId: string;
  participationMode: ParticipationMode;
  price?: number;
  isAvailable: boolean;
};

export function EventBottomActionBar({
  eventId,
  participationMode,
  price = 0,
  isAvailable,
}: Props) {
  const { user, loading } = useSupabaseUser();
  const authDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const [joining, setJoining] = useState(false);
  const [myReaction, setMyReaction] = useState<"planned" | "interested" | null>(
    null
  );
  const [reactionLoadingType, setReactionLoadingType] = useState<
    "planned" | "interested" | null
  >(null);

  useEffect(() => {
    setSaved(isBookmarked(eventId));
  }, [eventId]);

  const loadState = useCallback(() => {
    if (!user) return;
    fetchWithTimeout(`/api/events/${eventId}/reactions`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setMyReaction(d.myReaction ?? null))
      .catch(() => {});
    if (participationMode === "required") {
      fetchWithTimeout(`/api/events/${eventId}/join`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setApplied(d.applied ?? false))
        .catch(() => {});
    }
  }, [eventId, user, participationMode]);

  useEffect(() => {
    if (user) loadState();
  }, [user, loadState]);

  const handleSave = useCallback(() => {
    setSaved(toggleBookmark(eventId));
  }, [eventId]);

  const handleJoin = useCallback(async () => {
    if (!user) {
      window.location.href = getLoginUrl(`/events/${eventId}`);
      return;
    }
    setJoining(true);
    try {
      if (price > 0) {
        const res = await fetchWithTimeout("/api/stripe/checkout/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId }),
        });
        const j = await res.json();
        if (res.ok && j.url) {
          window.location.href = j.url;
          return;
        }
        alert(j.error ?? "申し込みに失敗しました");
      } else {
        const res = await fetchWithTimeout(`/api/events/${eventId}/join`, {
          method: "POST",
        });
        if (res.ok) setApplied(true);
        else {
          const j = await res.json();
          alert(j.error ?? "申し込みに失敗しました");
        }
      }
    } catch {
      alert("申し込みに失敗しました");
    } finally {
      setJoining(false);
    }
  }, [eventId, user, price]);

  const handleReaction = useCallback(
    async (type: "planned" | "interested") => {
      if (!user) {
        window.location.href = getLoginUrl(`/events/${eventId}`);
        return;
      }
      setReactionLoadingType(type);
      try {
        if (myReaction === type) {
          const res = await fetchWithTimeout(`/api/events/${eventId}/reactions`, {
            method: "DELETE",
          });
          const d = await res.json();
          if (res.ok) setMyReaction(d.myReaction ?? null);
        } else {
          const res = await fetchWithTimeout(`/api/events/${eventId}/reactions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type }),
          });
          const d = await res.json();
          if (res.ok) setMyReaction(d.myReaction ?? null);
        }
      } catch {
        /* noop */
      } finally {
        setReactionLoadingType(null);
      }
    },
    [eventId, user, myReaction]
  );

  const primaryLabel = (() => {
    if (participationMode === "required") {
      if (applied) return "申込済み";
      if (!user && !authDisabled) return "ログインして参加する";
      return "参加する";
    }
    if (reactionLoadingType === "planned") return "保存中...";
    if (!user && !authDisabled) return "ログインして参加予定にする";
    if (myReaction === "planned") return "参加予定です";
    return "参加予定にする";
  })();

  const primaryDisabled =
    loading ||
    !isAvailable ||
    (participationMode === "required"
      ? applied || joining
      : reactionLoadingType !== null);

  const handlePrimary = useCallback(async () => {
    if (participationMode === "required") {
      await handleJoin();
      return;
    }
    await handleReaction("planned");
  }, [participationMode, handleJoin, handleReaction]);

  if (!isAvailable) return null;

  return (
    <div
      className="fixed inset-x-0 z-40 border-t border-[var(--mg-line)] bg-[var(--mg-paper)]/95 shadow-[0_-6px_24px_rgba(15,23,42,0.08)] backdrop-blur-md supports-[backdrop-filter]:bg-[var(--mg-paper)]/90 sm:hidden"
      style={{
        bottom: `calc(${MOBILE_BOTTOM_NAV_CLEARANCE_PX}px + env(safe-area-inset-bottom, 0px))`,
      }}
      aria-label="イベントの操作"
    >
      <div
        className="mx-auto flex max-w-2xl items-center gap-3 px-4 pb-[env(safe-area-inset-bottom,0px)] pt-3"
        style={{ minHeight: MOBILE_EVENT_BOTTOM_ACTION_BAR_PX - 12 }}
      >
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex h-12 min-h-[var(--mg-touch-min)] min-w-[52px] shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--mg-line)] bg-white px-3 text-sm font-semibold text-[var(--mg-ink)] shadow-sm transition-colors active:bg-zinc-50"
          aria-label={saved ? "保存を解除" : "保存する"}
        >
          {saved ? (
            <BookmarkCheck className="h-5 w-5 text-[var(--accent)]" aria-hidden />
          ) : (
            <Bookmark className="h-5 w-5" aria-hidden />
          )}
          <span className="max-[380px]:sr-only">{saved ? "保存済み" : "保存"}</span>
        </button>

        <button
          type="button"
          onClick={handlePrimary}
          disabled={primaryDisabled}
          className="inline-flex min-h-[52px] min-w-0 flex-1 items-center justify-center rounded-xl bg-[var(--accent)] px-4 text-base font-bold text-white shadow-md transition-opacity disabled:opacity-50"
        >
          {participationMode === "required" && joining ? "処理中..." : primaryLabel}
        </button>
      </div>
    </div>
  );
}
