"use client";

import { useState, useEffect, useCallback } from "react";
import { toggleBookmark, isBookmarked } from "@/lib/bookmark-storage";
import { openMaps } from "@/lib/maps-url";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { getLoginUrl } from "@/lib/auth-utils";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

function buildCalendarUrl(
  title: string,
  date: string,
  startTime: string,
  endTime?: string,
  locationStr?: string
): string {
  const pad = (s: string | undefined) =>
    (s ?? "").replace(/-/g, "").replace(/:/g, "");
  const start = `${pad(date)}T${pad(startTime || "00:00")}00`;
  const end = endTime ? `${pad(date)}T${pad(endTime)}00` : start;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start}/${end}`,
    ctz: "Asia/Tokyo",
  });
  if (locationStr) params.set("location", locationStr);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

type ParticipationMode = "required" | "optional" | "none";

type Props = {
  eventId: string;
  participationMode: ParticipationMode;
  isAvailable: boolean;
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  address: string;
  location?: string;
  latitude?: number;
  longitude?: number;
};

export function EventDetailCTABlock({
  eventId,
  participationMode,
  isAvailable,
  title,
  date,
  startTime,
  endTime,
  address,
  location,
  latitude,
  longitude,
}: Props) {
  const { user, loading } = useSupabaseUser();
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const [joining, setJoining] = useState(false);
  const [myReaction, setMyReaction] = useState<"planned" | "interested" | null>(
    null
  );
  const [reactionLoadingType, setReactionLoadingType] = useState<"planned" | "interested" | null>(null);
  const [reactionError, setReactionError] = useState<string | null>(null);

  const loadState = useCallback(() => {
    setSaved(isBookmarked(eventId));
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
    setSaved(isBookmarked(eventId));
  }, [eventId]);

  useEffect(() => {
    if (user) loadState();
  }, [user, loadState]);

  const handleSave = useCallback(() => {
    const nowSaved = toggleBookmark(eventId);
    setSaved(nowSaved);
  }, [eventId]);

  const handleJoin = useCallback(async () => {
    if (!user) {
      window.location.href = getLoginUrl(`/events/${eventId}`);
      return;
    }
    setJoining(true);
    try {
      const res = await fetchWithTimeout(`/api/events/${eventId}/join`, {
        method: "POST",
      });
      if (res.ok) setApplied(true);
      else {
        const j = await res.json();
        alert(j.error ?? "申し込みに失敗しました");
      }
    } catch {
      alert("申し込みに失敗しました");
    } finally {
      setJoining(false);
    }
  }, [eventId, user]);

  const handleReaction = useCallback(
    async (type: "planned" | "interested") => {
      if (!user) {
        window.location.href = getLoginUrl(`/events/${eventId}`);
        return;
      }
      setReactionError(null);
      setReactionLoadingType(type);
      try {
        if (myReaction === type) {
          const res = await fetchWithTimeout(
            `/api/events/${eventId}/reactions`,
            { method: "DELETE" }
          );
          const d = await res.json();
          if (res.ok) setMyReaction(d.myReaction ?? null);
          else setReactionError(d.error ?? "解除できませんでした");
        } else {
          const res = await fetchWithTimeout(
            `/api/events/${eventId}/reactions`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type }),
            }
          );
          const d = await res.json();
          if (res.ok) setMyReaction(d.myReaction ?? null);
          else setReactionError(d.error ?? "保存できませんでした");
        }
      } catch {
        setReactionError("通信エラーです。もう一度お試しください。");
      } finally {
        setReactionLoadingType(null);
      }
    },
    [eventId, user, myReaction]
  );

  const handleOpenMaps = useCallback(() => {
    openMaps({ address, venueName: location, latitude, longitude });
  }, [address, location, latitude, longitude]);

  const calendarUrl = buildCalendarUrl(
    title,
    date,
    startTime,
    endTime,
    location && address ? `${location} ${address}` : location || address
  );

  if (!isAvailable) return null;

  const authDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

  return (
    <section id="event-cta" className="space-y-4">
      {/* 主CTA（参加方式に応じて可変） */}
      <div className="space-y-2">
        {participationMode === "required" && (
          <>
            {applied ? (
              <div className="flex min-h-[var(--mg-touch-min)] items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/20 dark:text-emerald-200">
                申込済みです
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={joining || (!user && !authDisabled)}
                  className="flex min-h-[var(--mg-touch-min)] w-full items-center justify-center rounded-xl bg-[var(--accent)] py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {joining
                    ? "処理中..."
                    : !user && !authDisabled
                      ? "ログインして申し込む"
                      : "申し込む"}
                </button>
              </>
            )}
          </>
        )}

        {participationMode === "optional" && (
          <>
            <p className="text-xs text-[var(--mg-muted)]">
              行く予定がある場合は「参加予定」に追加すると、マイページで確認できます。
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleReaction("planned")}
                disabled={reactionLoadingType !== null || (!user && !authDisabled)}
                className={`flex flex-1 min-h-[var(--mg-touch-min)] items-center justify-center rounded-xl py-3 font-medium transition ${
                  myReaction === "planned"
                    ? "bg-[var(--accent)] text-white shadow-sm"
                    : "border border-[var(--border)] bg-white text-[var(--mg-ink)] hover:bg-zinc-50 dark:bg-zinc-900/50 dark:hover:bg-zinc-800"
                }`}
              >
                {reactionLoadingType === "planned"
                  ? "保存中..."
                  : !user && !authDisabled
                    ? "ログインして参加予定"
                    : myReaction === "planned"
                      ? "参加予定です"
                      : "参加予定にする"}
              </button>
            </div>
            {reactionError && (
              <p className="text-xs text-red-600 dark:text-red-400" role="alert">
                {reactionError}
              </p>
            )}
            <p className="text-center text-xs text-[var(--mg-muted)]">
              当日そのまま参加も可能です
            </p>
          </>
        )}

        {participationMode === "none" && (
          <>
            <p className="text-xs text-[var(--mg-muted)]">
              <strong className="text-[var(--mg-ink)]">参加予定</strong>＝行く可能性が高いとき。
              <strong className="text-[var(--mg-ink)]">あとで見る</strong>＝まだ未定だが関心あり。マイページで一覧できます。
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleReaction("planned")}
                disabled={reactionLoadingType !== null || (!user && !authDisabled)}
                className={`flex flex-1 min-h-[var(--mg-touch-min)] items-center justify-center rounded-xl py-3 font-medium transition ${
                  myReaction === "planned"
                    ? "bg-[var(--accent)] text-white shadow-sm"
                    : "border border-[var(--border)] bg-white text-[var(--mg-ink)] hover:bg-zinc-50 dark:bg-zinc-900/50 dark:hover:bg-zinc-800"
                }`}
              >
                {reactionLoadingType === "planned"
                  ? "保存中..."
                  : !user && !authDisabled
                    ? "ログイン"
                    : myReaction === "planned"
                      ? "参加予定です"
                      : "参加予定にする"}
              </button>
              <button
                type="button"
                onClick={() => handleReaction("interested")}
                disabled={reactionLoadingType !== null || (!user && !authDisabled)}
                className={`flex flex-1 min-h-[var(--mg-touch-min)] items-center justify-center rounded-xl py-3 font-medium transition ${
                  myReaction === "interested"
                    ? "border-2 border-[var(--accent)] bg-[var(--mg-accent-soft)] text-[var(--accent)]"
                    : "border border-[var(--border)] bg-white text-[var(--mg-ink)] hover:bg-zinc-50 dark:bg-zinc-900/50 dark:hover:bg-zinc-800"
                }`}
              >
                {reactionLoadingType === "interested"
                  ? "保存中..."
                  : !user && !authDisabled
                    ? "ログイン"
                    : myReaction === "interested"
                      ? "あとで見る ✓"
                      : "あとで見る"}
              </button>
            </div>
            {reactionError && (
              <p className="text-xs text-red-600 dark:text-red-400" role="alert">
                {reactionError}
              </p>
            )}
            <p className="text-center text-xs text-[var(--mg-muted)]">
              当日そのまま参加できます
            </p>
          </>
        )}
      </div>

      {/* 補助アクション: 地図・カレンダー・保存 */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleOpenMaps}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] py-2.5 text-sm font-medium text-[var(--mg-ink)] transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          地図を開く
        </button>
        <a
          href={calendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] py-2.5 text-sm font-medium text-[var(--mg-ink)] transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          カレンダー
        </a>
        <button
          type="button"
          onClick={handleSave}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] py-2.5 text-sm font-medium text-[var(--mg-ink)] transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          {saved ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-[var(--accent)]">
                <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
              </svg>
              保存済み
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
              保存
            </>
          )}
        </button>
      </div>
    </section>
  );
}
