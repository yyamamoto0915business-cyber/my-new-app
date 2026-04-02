"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { isBookmarked, toggleBookmark } from "@/lib/bookmark-storage";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { getLoginUrl } from "@/lib/auth-utils";
import { useSupabaseUser } from "@/hooks/use-supabase-user";

type ParticipationMode = "required" | "optional" | "none";
type Availability = "available" | "full" | "ended" | "unknown";

type Props = {
  eventId: string;
  title: string;
  price?: number;
  participationMode: ParticipationMode;
  availability: Availability;
};

function getPrimaryLabel(
  participationMode: ParticipationMode,
  availability: Availability,
  applied: boolean
): string {
  if (availability === "ended") return "終了しました";
  if (availability === "full") return "満員です";
  if (participationMode === "required") return applied ? "申込済み" : "申し込む";
  return "参加する";
}

export function MobileEventCtaBar({
  eventId,
  title,
  price = 0,
  participationMode,
  availability,
}: Props) {
  const { user } = useSupabaseUser();
  const authDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";
  const [saved, setSaved] = useState(false);
  const [joining, setJoining] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    setSaved(isBookmarked(eventId));
  }, [eventId]);

  useEffect(() => {
    if (participationMode !== "required") return;
    if (!user && !authDisabled) return;
    fetchWithTimeout(`/api/events/${eventId}/join`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setApplied(Boolean(d?.applied)))
      .catch(() => {});
  }, [eventId, participationMode, user, authDisabled]);

  const primaryDisabled =
    joining ||
    availability === "ended" ||
    availability === "full" ||
    (participationMode === "required" && applied);

  const primaryLabel = useMemo(
    () => getPrimaryLabel(participationMode, availability, applied),
    [participationMode, availability, applied]
  );

  const handleSave = useCallback(() => {
    const nowSaved = toggleBookmark(eventId);
    setSaved(nowSaved);
  }, [eventId]);

  const handlePrimary = useCallback(async () => {
    if (availability === "ended" || availability === "full") return;

    // required はこのバーから申込を実行（既存導線と同じAPIへ）
    if (participationMode === "required") {
      if (!user && !authDisabled) {
        window.location.href = getLoginUrl(`/events/${eventId}`);
        return;
      }
      if (applied) return;
      setJoining(true);
      try {
        if (price > 0) {
          const res = await fetchWithTimeout("/api/stripe/checkout/event", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventId }),
          });
          const j = await res.json().catch(() => ({}));
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
            const j = await res.json().catch(() => ({}));
            alert(j.error ?? "申し込みに失敗しました");
          }
        }
      } catch {
        alert("申し込みに失敗しました");
      } finally {
        setJoining(false);
      }
      return;
    }

    // optional/none は既存CTAへ誘導（詳細を壊さず、選択肢も維持）
    const el = document.getElementById("event-cta");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [availability, participationMode, user, authDisabled, applied, price, eventId]);

  // 終了イベントはバー自体を出さない（読みやすさ優先）
  if (availability === "ended") return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/75 sm:hidden"
      aria-label="参加・保存"
    >
      <div className="mx-auto flex max-w-screen-md items-center gap-3 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
        <button
          type="button"
          onClick={handlePrimary}
          disabled={primaryDisabled}
          className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-green-600 px-4 text-sm font-semibold text-white transition disabled:opacity-50"
          aria-label={primaryLabel}
        >
          {joining ? "処理中..." : primaryLabel}
        </button>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors active:bg-slate-50"
          aria-label={saved ? "保存を解除" : "保存する"}
        >
          {saved ? (
            <>
              <BookmarkCheck className="h-4 w-4" aria-hidden />
              保存済み
            </>
          ) : (
            <>
              <Bookmark className="h-4 w-4" aria-hidden />
              保存
            </>
          )}
        </button>
      </div>
    </div>
  );
}

