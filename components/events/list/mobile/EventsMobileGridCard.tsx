"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart, MapPin } from "lucide-react";
import type { Event } from "@/lib/db/types";
import { getEventStatus } from "@/lib/events";
import { formatEventScheduleLabel } from "@/lib/event-recurrence";
import { isEventImageHostAllowed } from "@/lib/event-image-display";
import { addToRecent, isBookmarked, toggleBookmark } from "@/lib/bookmark-storage";
import { getPrimaryCategory } from "@/lib/inferCategory";
import { CATEGORY_LABELS } from "@/lib/categories";
import { getTagLabel } from "@/lib/db/types";

type Props = { event: Event };

function CardCoverImage({ imageUrl, alt }: { imageUrl: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!imageUrl?.trim() || failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#E8EBE6] text-[8px] text-[#AABCAA]">
        画像なし
      </div>
    );
  }

  const url = imageUrl.trim();
  const className = "absolute inset-0 h-full w-full object-cover object-center";

  if (isEventImageHostAllowed(url)) {
    return (
      <Image
        src={url}
        alt={alt}
        fill
        sizes="42vw"
        className={className}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} className={className} onError={() => setFailed(true)} />
  );
}

export function EventsMobileGridCard({ event }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(() => isBookmarked(event.id));
  const status = getEventStatus(event);
  const isFree = event.price === 0;

  const category = getPrimaryCategory(event);
  const categoryLabel = category ? CATEGORY_LABELS[category] : null;

  const displayTags = useMemo(() => {
    const fromTags = (event.tags ?? [])
      .map((id) => getTagLabel(id))
      .filter((l) => l && l !== "無料" && l !== "子供向け");
    const combined =
      categoryLabel && !fromTags.includes(categoryLabel)
        ? [categoryLabel, ...fromTags]
        : fromTags;
    return combined.slice(0, 2);
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
      className={`flex cursor-pointer flex-col overflow-hidden rounded-[8px] border border-[#E8EBE6] bg-white shadow-[0_1px_4px_rgba(15,23,42,0.04)] transition active:scale-[0.99] ${
        status === "ended" ? "opacity-70" : ""
      }`}
      aria-label={`${event.title}の詳細を見る`}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-[#E8EBE6]">
        <CardCoverImage imageUrl={event.imageUrl} alt={event.title} />

        <div className="absolute left-1 top-1 z-10 flex max-w-[calc(100%-24px)] flex-wrap gap-0.5">
          <span
            className={`inline-flex h-4 items-center rounded px-1 text-[8px] font-semibold shadow-sm ${
              isFree
                ? "bg-[#E8F5EC] text-[#2D7A4F] ring-1 ring-[#B8DFC5]/90"
                : "bg-[#EEF4FC] text-[#2B5A9E] ring-1 ring-[#B8CCE8]/90"
            }`}
          >
            {isFree ? "無料" : "有料"}
          </span>
          {status === "available" ? (
            <span className="inline-flex h-4 items-center rounded bg-[#F5F8F5] px-1 text-[8px] font-semibold text-[#566358] shadow-sm ring-1 ring-[#DDE8DF]/90">
              募集中
            </span>
          ) : status === "full" ? (
            <span className="inline-flex h-4 items-center rounded bg-[#F5F8F5] px-1 text-[8px] font-semibold text-[#566358] shadow-sm ring-1 ring-[#DDE8DF]/90">
              満員
            </span>
          ) : (
            <span className="inline-flex h-4 items-center rounded bg-[#F5F8F5] px-1 text-[8px] font-semibold text-[#566358] shadow-sm ring-1 ring-[#DDE8DF]/90">
              終了
            </span>
          )}
        </div>

        <button
          type="button"
          aria-label={saved ? "お気に入り解除" : "お気に入りに追加"}
          className="absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-white/95 shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            setSaved(toggleBookmark(event.id));
          }}
        >
          <Heart
            className="h-3 w-3"
            style={{
              color: saved ? "#2D7A4F" : "#8A9088",
              fill: saved ? "#2D7A4F" : "none",
            }}
          />
        </button>
      </div>

      <div className="space-y-0.5 px-1.5 py-1">
        <p className="truncate text-[9px] font-medium leading-none text-[#566358]">
          {scheduleLabel}
        </p>
        <h3 className="line-clamp-2 text-[10px] font-bold leading-[1.25] text-[#1A2214]">
          {event.title}
        </h3>
        <p className="flex items-center gap-0.5 text-[9px] leading-none text-[#6A7068]">
          <MapPin className="h-2 w-2 shrink-0 text-[#2D7A4F]" aria-hidden />
          <span className="truncate">{event.location}</span>
        </p>
        {displayTags.length > 0 ? (
          <div className="flex h-4 gap-0.5 overflow-hidden pt-px">
            {displayTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex h-4 max-w-full shrink items-center truncate rounded-full border border-[#E8EBE6] bg-[#F8FAF8] px-1 text-[8px] text-[#566358]"
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
