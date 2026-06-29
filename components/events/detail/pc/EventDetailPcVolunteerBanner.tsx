"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, HandHeart, MessageCircle, UserPlus } from "lucide-react";
import { toggleBookmark, isBookmarked } from "@/lib/bookmark-storage";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { getLoginUrl } from "@/lib/auth-utils";
import { useEventOrganizerConsult } from "@/app/events/[id]/event-organizer-consult-provider";
import { cn } from "@/lib/utils";

type Props = {
  eventId: string;
  recruitmentId?: string | null;
  /** ヒーローカード下部に埋め込む場合 */
  embedded?: boolean;
};

export function EventDetailPcVolunteerBanner({
  eventId,
  recruitmentId,
  embedded = false,
}: Props) {
  const { user } = useSupabaseUser();
  const authDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";
  const { openConsult, opening: consultOpening } = useEventOrganizerConsult();
  const [saved, setSaved] = useState(false);

  const applyHref =
    !user && !authDisabled
      ? getLoginUrl(
          recruitmentId
            ? `/recruitments/${recruitmentId}`
            : `/recruitments?event=${eventId}`
        )
      : recruitmentId
        ? `/recruitments/${recruitmentId}`
        : `/recruitments?event=${eventId}`;

  const handleSave = useCallback(() => {
    const next = toggleBookmark(eventId);
    setSaved(next);
  }, [eventId]);

  useEffect(() => {
    setSaved(isBookmarked(eventId));
  }, [eventId]);

  const actionBtn =
    "inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-lg text-[12px] font-semibold transition";
  const actionSecondary =
    `${actionBtn} border border-[#e0e8d4] bg-white px-2.5 text-[#526448] hover:border-[#348b38] hover:text-[#348b38]`;
  const actionPrimary =
    `${actionBtn} bg-[#348b38] px-3.5 font-bold text-white hover:bg-[#2d7a32]`;

  return (
    <section
      className={cn(
        "flex flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3",
        embedded
          ? "border-t border-[#e8edd8] bg-[#fafcf8]"
          : "mt-4 rounded-2xl border border-[#e8edd8] bg-white"
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef5ef] text-[#348b38]">
          <HandHeart className="h-3.5 w-3.5" aria-hidden />
        </div>
        <p className="text-[12px] font-semibold leading-snug text-[#1a2818]">
          このイベントはボランティアを募集しています
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 sm:shrink-0 sm:justify-end">
        <Link href={applyHref} className={actionPrimary}>
          <UserPlus className="h-3.5 w-3.5 shrink-0" aria-hidden />
          ボランティアに応募する
        </Link>
        <button
          type="button"
          onClick={() => openConsult("question")}
          disabled={consultOpening}
          className={cn(actionSecondary, "disabled:opacity-50")}
        >
          <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {consultOpening ? "準備中..." : "主催者に相談"}
        </button>
        <button
          type="button"
          onClick={handleSave}
          className={cn(
            actionSecondary,
            saved && "border-[#348b38] bg-[#f4faf6] text-[#348b38]"
          )}
        >
          <Bookmark
            className={cn("h-3.5 w-3.5", saved && "fill-[#348b38]")}
            aria-hidden
          />
          あとで見る
        </button>
      </div>
    </section>
  );
}
