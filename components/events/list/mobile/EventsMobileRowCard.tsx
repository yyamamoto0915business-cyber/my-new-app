"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Bookmark, MapPin } from "lucide-react";
import type { Event } from "@/lib/db/types";
import { getEventStatus } from "@/lib/events";
import { formatEventScheduleLabel } from "@/lib/event-recurrence";
import { isEventImageHostAllowed } from "@/lib/event-image-display";
import { addToRecent, isBookmarked, toggleBookmark } from "@/lib/bookmark-storage";
import { getPrimaryCategory } from "@/lib/inferCategory";
import { CATEGORY_LABELS } from "@/lib/categories";
import { getTagLabel } from "@/lib/db/types";

type Props = { event: Event };

function ThumbImage({ imageUrl, alt }: { imageUrl: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!imageUrl?.trim() || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#edece8] text-[10px] text-[#999999]">
        画像なし
      </div>
    );
  }

  const url = imageUrl.trim();
  if (isEventImageHostAllowed(url)) {
    return (
      <Image
        src={url}
        alt={alt}
        fill
        sizes="104px"
        className="object-cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} className="h-full w-full object-cover" onError={() => setFailed(true)} />
  );
}

export function EventsMobileRowCard({ event }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(() => isBookmarked(event.id));
  const status = getEventStatus(event);
  const isFree = event.price === 0;

  const category = getPrimaryCategory(event);
  const categoryLabel = category ? CATEGORY_LABELS[category] : null;

  const displayTags = useMemo(() => {
    return (event.tags ?? [])
      .slice(0, 4)
      .map((id) => getTagLabel(id))
      .filter((l) => l && l !== "無料" && l !== "子供向け" && l !== categoryLabel)
      .slice(0, 3);
  }, [event.tags, categoryLabel]);

  const scheduleLabel = formatEventScheduleLabel(
    event.date,
    event.startTime,
    event.endTime,
    event.recurrence ?? "none",
    event.recurrenceCount
  );

  const handleOpen = () => {
    addToRecent(event.id);
    router.push(`/events/${event.id}`);
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(e) => e.key === "Enter" && handleOpen()}
      className={`flex items-stretch gap-3 overflow-hidden rounded-[14px] border border-[#e8eae6] bg-white p-3 shadow-[0_1px_4px_rgba(34,51,68,0.05)] transition active:scale-[0.995] ${
        status === "ended" ? "opacity-65" : ""
      }`}
      aria-label={`${event.title}の詳細を見る`}
    >
      <div className="relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-[12px] bg-[#edece8]">
        <ThumbImage imageUrl={event.imageUrl} alt={event.title} />

        <div className="absolute left-1.5 top-1.5 flex flex-wrap gap-1">
          <span
            className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-semibold ${
              isFree
                ? "bg-[#e8f2ea] text-[#2f6b4f]"
                : "bg-[#ebf3f9] text-[#2980b9]"
            }`}
          >
            {isFree ? "無料" : "有料"}
          </span>
          {status === "ended" ? (
            <span className="inline-flex rounded bg-[#f4f5f3] px-1.5 py-0.5 text-[9px] font-semibold text-[#666666]">
              終了
            </span>
          ) : status === "full" ? (
            <span className="inline-flex rounded bg-[#f4f5f3] px-1.5 py-0.5 text-[9px] font-semibold text-[#666666]">
              満員
            </span>
          ) : null}
        </div>

        {categoryLabel ? (
          <span className="absolute bottom-1.5 left-1.5 inline-flex max-w-[calc(100%-12px)] truncate rounded bg-black/45 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur-[1px]">
            {categoryLabel}
          </span>
        ) : null}
      </div>

      <div className="relative flex min-w-0 flex-1 flex-col py-0.5 pr-6">
        <button
          type="button"
          aria-label={saved ? "お気に入り解除" : "お気に入りに追加"}
          className="absolute right-0 top-0 flex h-7 w-7 items-center justify-center text-[#999999]"
          onClick={(e) => {
            e.stopPropagation();
            setSaved(toggleBookmark(event.id));
          }}
        >
          <Bookmark
            className="h-4 w-4"
            style={{
              color: saved ? "#2f7d4e" : "#999999",
              fill: saved ? "#2f7d4e" : "none",
            }}
          />
        </button>

        <p className="text-[11px] leading-snug text-[#666666]">{scheduleLabel}</p>
        <h3 className="mt-0.5 line-clamp-2 text-[14px] font-bold leading-[1.35] text-[#223344]">
          {event.title}
        </h3>
        <p className="mt-1 flex items-start gap-1 text-[11px] text-[#666666]">
          <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-[#2f7d4e]" aria-hidden />
          <span className="line-clamp-2">{event.location}</span>
        </p>
        {displayTags.length > 0 ? (
          <div className="mt-auto flex flex-wrap gap-1 pt-1.5">
            {displayTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex rounded-full bg-[#f4f5f3] px-2 py-0.5 text-[10px] text-[#666666]"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
