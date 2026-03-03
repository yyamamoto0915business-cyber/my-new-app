"use client";

import { useRouter } from "next/navigation";
import type { Event } from "@/lib/db/types";
import { CATEGORY_LABELS } from "@/lib/categories";
import { getPrimaryCategory } from "@/lib/inferCategory";
import { addToRecent } from "@/lib/bookmark-storage";
import { EventThumbnail } from "@/components/event-thumbnail";
import { BookmarkToggle } from "@/components/ui/BookmarkToggle";

type Props = {
  event: Event;
  isBookmarked: boolean;
  onBookmarkToggle: (id: string) => void;
};

/** メインカード：グラデ・半透明丸背景の保存アイコン・バッジ最大2つ */
export function EventHeroCard({
  event,
  isBookmarked,
  onBookmarkToggle,
}: Props) {
  const router = useRouter();
  const category = getPrimaryCategory(event);

  const handleClick = () => {
    addToRecent(event.id);
    router.push(`/events/${event.id}`);
  };

  // バッジは最大2つ：カテゴリ + 無料（無料でない場合はカテゴリのみ or カテゴリ+価格）
  const badges: { label: string; accent?: boolean }[] = [];
  if (category) badges.push({ label: CATEGORY_LABELS[category] });
  if (event.price === 0) badges.push({ label: "無料", accent: true });
  else if (badges.length < 2) badges.push({ label: `¥${event.price}` });

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm transition-shadow hover:shadow-md active:scale-[0.995] dark:bg-[var(--background)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <EventThumbnail
          imageUrl={event.imageUrl}
          alt={event.title}
          rounded="none"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
        {badges.length > 0 && (
          <div className="absolute left-2 top-2 z-10 flex gap-1.5">
            {badges.slice(0, 2).map((b) => (
              <span
                key={b.label}
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  b.accent
                    ? "bg-white/90 text-[var(--accent)]"
                    : "bg-black/50 text-white backdrop-blur-sm"
                }`}
              >
                {b.label}
              </span>
            ))}
          </div>
        )}
        <div
          className="absolute right-2 top-2 z-10 flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full bg-black/40 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <BookmarkToggle
            eventId={event.id}
            isActive={isBookmarked}
            onToggle={onBookmarkToggle}
          />
        </div>
        <div className="absolute bottom-2 left-2 right-2 text-white">
          <p className="text-xs font-medium drop-shadow-md">{event.organizerName}</p>
          <h3 className="mt-0.5 line-clamp-2 font-serif text-sm font-semibold drop-shadow-md">
            {event.title}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-xs drop-shadow-md opacity-95">
            {event.date} {event.startTime}
            {event.endTime ? `〜${event.endTime}` : ""} ・ {event.location}
          </p>
        </div>
      </div>
    </div>
  );
}
