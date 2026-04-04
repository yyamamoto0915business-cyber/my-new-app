"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Event } from "@/lib/db/types";
import { CATEGORY_LABELS } from "@/lib/categories";
import { getPrimaryCategory } from "@/lib/inferCategory";
import { addToRecent } from "@/lib/bookmark-storage";
import { EventCardFlyerImage } from "@/components/events/EventCardFlyerImage";
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
      <div className="relative aspect-[16/10] overflow-hidden rounded-t-2xl">
        <EventCardFlyerImage imageUrl={event.imageUrl} alt={event.title} />
        <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
        {badges.length > 0 && (
          <div className="absolute left-2 top-2 z-[2] flex gap-1.5">
            {badges.slice(0, 2).map((b) => (
              <span
                key={b.label}
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium shadow-sm ring-1 ring-black/5 ${
                  b.accent
                    ? "bg-white/95 text-[var(--accent)]"
                    : "bg-white/92 text-slate-700 backdrop-blur-sm"
                }`}
              >
                {b.label}
              </span>
            ))}
          </div>
        )}
        <div
          className="absolute right-2 top-2 z-[2] flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-slate-200/70 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <BookmarkToggle
            eventId={event.id}
            isActive={isBookmarked}
            onToggle={onBookmarkToggle}
            tone="light"
          />
        </div>
        <div className="absolute bottom-2 left-2 right-2 z-[2] text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]">
          {event.organizerName && (
            event.organizerId ? (
              <Link
                href={`/organizers/${event.organizerId}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-medium hover:underline"
              >
                by {event.organizerName}
              </Link>
            ) : (
              <p className="text-xs font-medium">by {event.organizerName}</p>
            )
          )}
          <h3 className="mt-0.5 line-clamp-2 font-serif text-sm font-semibold">
            {event.title}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-xs opacity-95">
            {event.date} {event.startTime}
            {event.endTime ? `〜${event.endTime}` : ""} ・ {event.location}
          </p>
        </div>
      </div>
    </div>
  );
}
