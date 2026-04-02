"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark, BookmarkCheck, Share2 } from "lucide-react";
import { isBookmarked, toggleBookmark } from "@/lib/bookmark-storage";
import { cn } from "@/lib/utils";
import { MOBILE_EVENT_HEADER_ROW_PX } from "./layout-constants";

type Props = {
  eventId: string;
  title: string;
  shareUrl: string;
  className?: string;
};

export function MobileEventHeader({ eventId, title, shareUrl, className }: Props) {
  const [saved, setSaved] = useState(() => isBookmarked(eventId));

  const handleShare = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text: title, url: shareUrl });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      /* ユーザーがキャンセルした場合など */
    }
  }, [shareUrl, title]);

  return (
    <header
      style={{ height: MOBILE_EVENT_HEADER_ROW_PX, minHeight: MOBILE_EVENT_HEADER_ROW_PX }}
      className={cn(
        "flex shrink-0 items-center gap-2 px-4",
        className
      )}
    >
      <Link
        href="/events"
        className="inline-flex h-11 min-h-[var(--mg-touch-min)] w-11 min-w-[var(--mg-touch-min)] shrink-0 items-center justify-center rounded-[var(--mg-radius)] border border-[var(--mg-line)] bg-white text-[var(--mg-ink)] shadow-[var(--mg-shadow)] transition-colors active:bg-zinc-50"
        aria-label="イベント一覧に戻る"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden />
      </Link>

      <p className="min-w-0 flex-1 truncate text-center text-[15px] font-semibold leading-snug text-[var(--mg-ink)]">
        {title}
      </p>

      <button
        type="button"
        onClick={handleShare}
        className="inline-flex h-11 min-h-[var(--mg-touch-min)] w-11 min-w-[var(--mg-touch-min)] shrink-0 items-center justify-center rounded-[var(--mg-radius)] border border-[var(--mg-line)] bg-white text-[var(--mg-ink)] shadow-[var(--mg-shadow)] transition-colors active:bg-zinc-50"
        aria-label="共有する"
      >
        <Share2 className="h-5 w-5" aria-hidden />
      </button>

      <button
        type="button"
        onClick={() => setSaved(toggleBookmark(eventId))}
        className="inline-flex h-11 min-h-[var(--mg-touch-min)] w-11 min-w-[var(--mg-touch-min)] shrink-0 items-center justify-center rounded-[var(--mg-radius)] border border-[var(--mg-line)] bg-white text-[var(--mg-ink)] shadow-[var(--mg-shadow)] transition-colors active:bg-zinc-50"
        aria-label={saved ? "保存を解除" : "保存する"}
      >
        {saved ? (
          <BookmarkCheck className="h-5 w-5 text-[var(--accent)]" aria-hidden />
        ) : (
          <Bookmark className="h-5 w-5" aria-hidden />
        )}
      </button>
    </header>
  );
}
