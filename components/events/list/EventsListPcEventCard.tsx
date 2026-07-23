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

function isPopularEvent(event: Event): boolean {
  return (event.participantCount ?? 0) >= 8 || (event.avgRating ?? 0) >= 4.5;
}

function CardCoverImage({ imageUrl, alt }: { imageUrl: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!imageUrl?.trim() || failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#E8EBE6] text-[10px] text-[#AABCAA]">
        画像なし
      </div>
    );
  }

  const url = imageUrl.trim();
  const className =
    "absolute inset-0 h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.04]";

  if (isEventImageHostAllowed(url)) {
    return (
      <Image
        src={url}
        alt={alt}
        fill
        sizes="(min-width: 1200px) 220px, (min-width: 900px) 25vw, 45vw"
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

export function EventsListPcEventCard({ event }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(() => isBookmarked(event.id));
  const status = getEventStatus(event);
  const isFree = event.price === 0;
  const isPopular = isPopularEvent(event);
  const needsReservation = Boolean(event.requiresRegistration);

  const category = getPrimaryCategory(event);
  const categoryLabel = category ? CATEGORY_LABELS[category] : null;

  const displayTags = useMemo(() => {
    const fromTags = (event.tags ?? [])
      .slice(0, 2)
      .map((id) => getTagLabel(id))
      .filter((l) => l && l !== "無料" && l !== "子供向け");
    if (categoryLabel && !fromTags.includes(categoryLabel)) {
      return [categoryLabel, ...fromTags].slice(0, 2);
    }
    return fromTags.length ? fromTags : categoryLabel ? [categoryLabel] : [];
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
      className={`group flex cursor-pointer flex-col overflow-hidden rounded-[8px] border border-[#E8EBE6] bg-white shadow-[0_1px_4px_rgba(15,23,42,0.04)] transition hover:border-[#B8DFC5] hover:shadow-[0_3px_10px_rgba(45,122,79,0.08)] ${
        status === "ended" ? "opacity-70" : ""
      }`}
      aria-label={`${event.title}の詳細を見る`}
    >
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-[#E8EBE6]">
        <CardCoverImage imageUrl={event.imageUrl} alt={event.title} />

        <div className="absolute left-1 top-1 z-10 flex max-w-[calc(100%-28px)] flex-wrap gap-0.5">
          <span
            className={`inline-flex h-4 items-center rounded px-1 text-[8px] font-semibold shadow-sm ${
              isFree
                ? "bg-[#E8F5EC] text-[#2D7A4F] ring-1 ring-[#B8DFC5]/90"
                : "bg-[#EEF4FC] text-[#2B5A9E] ring-1 ring-[#B8CCE8]/90"
            }`}
          >
            {isFree ? "無料" : "有料"}
          </span>
          {isPopular ? (
            <span className="inline-flex h-4 items-center rounded bg-[#FFF4E8] px-1 text-[8px] font-semibold text-[#C45A12] shadow-sm ring-1 ring-[#F5D4B0]/90">
              人気
            </span>
          ) : null}
          {needsReservation ? (
            <span className="inline-flex h-4 items-center rounded bg-[#EEF4FC] px-1 text-[8px] font-semibold text-[#2B5A9E] shadow-sm ring-1 ring-[#B8CCE8]/90">
              要予約
            </span>
          ) : null}
          {status === "ended" ? (
            <span className="inline-flex h-4 items-center rounded bg-[#F5F8F5] px-1 text-[8px] font-semibold text-[#566358] shadow-sm ring-1 ring-[#DDE8DF]/90">
              終了
            </span>
          ) : status === "full" ? (
            <span className="inline-flex h-4 items-center rounded bg-[#F5F8F5] px-1 text-[8px] font-semibold text-[#566358] shadow-sm ring-1 ring-[#DDE8DF]/90">
              満員
            </span>
          ) : null}
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

      <div className="flex flex-1 flex-col gap-0.5 px-2 py-1.5">
        <p className="text-[9px] font-medium leading-tight text-[#566358]">{scheduleLabel}</p>
        <h3 className="line-clamp-2 text-[12px] font-bold leading-snug text-[#1A2214]">
          {event.title}
        </h3>
        <p className="flex items-center gap-0.5 text-[9px] text-[#6A7068]">
          <MapPin className="h-2 w-2 shrink-0 text-[#2D7A4F]" aria-hidden />
          <span className="line-clamp-1">{event.location}</span>
        </p>
        {displayTags.length > 0 ? (
          <div className="mt-auto flex flex-wrap gap-0.5 pt-0.5">
            {displayTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex h-4 items-center rounded-full border border-[#E8EBE6] bg-[#F8FAF8] px-1 text-[8px] text-[#566358]"
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
