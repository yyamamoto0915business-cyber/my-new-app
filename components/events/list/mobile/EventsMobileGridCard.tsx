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
      <div className="absolute inset-0 flex items-center justify-center bg-[#e8ebe6] text-[10px] text-[#8a9088]">
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
      className={`flex cursor-pointer flex-col overflow-hidden rounded-[14px] border border-[#dde9e1] bg-white shadow-[0_2px_10px_rgba(22,56,40,0.05)] transition active:scale-[0.99] ${
        status === "ended" ? "opacity-70" : ""
      }`}
      aria-label={`${event.title}の詳細を見る`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#e8ebe6]">
        <CardCoverImage imageUrl={event.imageUrl} alt={event.title} />

        <div className="absolute left-1.5 top-1.5 z-10 flex max-w-[calc(100%-28px)] flex-wrap gap-1">
          <span
            className={`inline-flex h-[18px] items-center rounded-md px-1.5 text-[9px] font-semibold ${
              isFree
                ? "bg-[#e8f5ec] text-[#2f6b4f]"
                : "bg-[#eef4fc] text-[#2b5a9e]"
            }`}
          >
            {isFree ? "無料" : "有料"}
          </span>
          {status === "ended" ? (
            <span className="inline-flex h-[18px] items-center rounded-md bg-white/95 px-1.5 text-[9px] font-semibold text-[#6a7068]">
              終了
            </span>
          ) : status === "full" ? (
            <span className="inline-flex h-[18px] items-center rounded-md bg-white/95 px-1.5 text-[9px] font-semibold text-[#6a7068]">
              満員
            </span>
          ) : null}
        </div>

        <button
          type="button"
          aria-label={saved ? "お気に入り解除" : "お気に入りに追加"}
          className="absolute right-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 shadow-[0_1px_4px_rgba(22,56,40,0.12)]"
          onClick={(e) => {
            e.stopPropagation();
            setSaved(toggleBookmark(event.id));
          }}
        >
          <Heart
            className="h-3.5 w-3.5"
            style={{
              color: saved ? "#2f6b4f" : "#8a9088",
              fill: saved ? "#2f6b4f" : "none",
            }}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1 px-2.5 pb-2.5 pt-2">
        <p className="truncate text-[10px] font-medium leading-none text-[#2f6b4f]">
          {scheduleLabel}
        </p>
        <h3 className="line-clamp-2 text-[12px] font-bold leading-[1.35] text-[#163828]">
          {event.title}
        </h3>
        <p className="flex items-center gap-0.5 text-[10px] leading-none text-[#6a7068]">
          <MapPin className="h-2.5 w-2.5 shrink-0 text-[#2f6b4f]" aria-hidden />
          <span className="truncate">{event.location}</span>
        </p>
        {displayTags.length > 0 ? (
          <div className="mt-auto flex gap-1 overflow-hidden pt-0.5">
            {displayTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex h-[18px] max-w-full shrink items-center truncate rounded-full border border-[#dde9e1] bg-[#f7fbf8] px-1.5 text-[9px] text-[#3d5c48]"
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
