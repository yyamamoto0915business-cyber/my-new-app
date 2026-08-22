"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useEventOrganizerConsult } from "@/app/events/[id]/event-organizer-consult-provider";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Share2,
  CalendarDays,
  MapPin,
  JapaneseYen,
  CircleUserRound,
  CircleCheck,
  MessageCircle,
} from "lucide-react";
import type { Event } from "@/lib/db/types";
import { EventDetailFlyerImage } from "@/components/events/EventDetailFlyerImage";
import { DetailImageSwitcher } from "@/components/media/DetailImageSwitcher";
import { formatEventScheduleLabel } from "@/lib/event-recurrence";
import { getPrimaryCategory } from "@/lib/inferCategory";
import { CATEGORY_LABELS } from "@/lib/categories";
import { getEventStatus } from "@/lib/events";
import { isBookmarked, toggleBookmark } from "@/lib/bookmark-storage";
import { getMapsUrl } from "@/lib/maps-url";
import { cn } from "@/lib/utils";
import { MOBILE_EVENT_DETAIL_MAIN_PADDING_BOTTOM_PX } from "./layout-constants";

const MOBILE_TABS = ["概要", "参加方法", "Q&A"] as const;

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

type Props = {
  eventId: string;
  eventTitle: string;
  shareUrl: string;
  event: Event;
  primaryActionsSlot: React.ReactNode;
  overviewChildren: React.ReactNode;
  participationChildren: React.ReactNode;
  qnaChildren: React.ReactNode;
  participationReception: string;
  receptionLabel: string;
};

export function MobileEventDetailView({
  eventId,
  eventTitle,
  shareUrl,
  event,
  primaryActionsSlot,
  overviewChildren,
  participationChildren,
  qnaChildren,
  participationReception,
  receptionLabel,
}: Props) {
  const router = useRouter();
  const { openConsult, opening: consultOpening } = useEventOrganizerConsult();
  const [tab, setTab] = useState<string>("概要");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isBookmarked(eventId));
  }, [eventId]);

  const handleBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/events");
  }, [router]);

  const handleShare = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: eventTitle, url: shareUrl });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      /* ignore */
    }
  }, [shareUrl, eventTitle]);

  const status = getEventStatus(event);
  const isAvailable = status === "available";
  const category = getPrimaryCategory(event);
  const categoryLabel = category ? CATEGORY_LABELS[category] : undefined;
  const organizerId = "organizerId" in event ? event.organizerId : null;

  const dateLine = formatEventScheduleLabel(
    event.date,
    event.startTime,
    event.endTime,
    event.recurrence ?? "none",
    event.recurrenceCount
  );

  const priceLine =
    event.price === 0
      ? "無料"
      : `¥${Number(event.price).toLocaleString("ja-JP")}`;
  const priceSuffix = event.priceNote ? `（${event.priceNote}）` : "";

  const calendarUrl = buildCalendarUrl(
    event.title,
    event.date,
    event.startTime,
    event.endTime,
    event.location && event.address
      ? `${event.location} ${event.address}`
      : event.location || event.address
  );

  const mapsQuery = event.address || event.location || "";
  const mapsHref = mapsQuery
    ? getMapsUrl({
        address: mapsQuery,
        venueName: event.location,
        latitude: event.latitude,
        longitude: event.longitude,
      })
    : null;

  return (
    <div
      className="mg-event-detail min-[900px]:hidden"
      style={
        {
          paddingBottom: `calc(${MOBILE_EVENT_DETAIL_MAIN_PADDING_BOTTOM_PX}px + env(safe-area-inset-bottom, 0px))`,
        } as React.CSSProperties
      }
    >
      <header className="sticky top-0 z-50 flex h-[52px] items-center justify-between border-b border-[var(--ed-line)] bg-white px-4 pt-[env(safe-area-inset-top,0px)]">
        <button
          type="button"
          onClick={handleBack}
          className="flex h-10 w-10 items-center justify-center text-[var(--ed-ink)]"
          aria-label="戻る"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </button>

        <Link
          href="/"
          className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1.5"
          aria-label="MachiGlyph ホーム"
        >
          <Image
            src="/brand/machiglyph_mark.png"
            alt=""
            width={36}
            height={36}
            unoptimized
            className="h-9 w-9 object-contain bg-transparent"
          />
          <span
            className="text-[16px] font-bold tracking-tight text-[var(--ed-forest,var(--ed-accent))]"
            style={{ fontFamily: "var(--font-serif-display)" }}
          >
            MachiGlyph
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSaved(toggleBookmark(eventId))}
            className="p-1 text-[var(--ed-ink)]"
            aria-label={saved ? "ブックマーク解除" : "ブックマーク"}
          >
            {saved ? (
              <BookmarkCheck className="h-5 w-5 text-[var(--ed-forest)]" aria-hidden />
            ) : (
              <Bookmark className="h-5 w-5" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="p-1 text-[var(--ed-ink)]"
            aria-label="シェア"
          >
            <Share2 className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </header>

      <div className="px-4 pt-3">
        <DetailImageSwitcher
          coverUrl={event.imageUrl}
          galleryImages={event.galleryImages}
          alt={event.title}
          renderMain={(activeUrl) => (
            <EventDetailFlyerImage
              imageUrl={activeUrl}
              alt={event.title}
              priority
              variant="mobileHero"
              className="h-[210px]"
            />
          )}
        />
      </div>

      <div className="flex flex-col gap-3.5 px-4 pt-4">
        <div className="flex flex-wrap gap-2">
          {categoryLabel ? <span className="ed-chip">{categoryLabel}</span> : null}
          <span className="ed-chip-muted">{receptionLabel}</span>
        </div>

        <h1 className="text-[24px] font-bold leading-[1.35] tracking-tight text-[var(--ed-ink)]">
          {event.title}
        </h1>

        {event.description ? (
          <p className="line-clamp-3 text-[13.5px] leading-[1.7] text-[var(--ed-muted)]">
            {event.description}
          </p>
        ) : null}

        <ul className="space-y-2.5">
          <li className="flex gap-2.5 text-[13.5px]">
            <CalendarDays
              className="ed-icon-well mt-0.5 h-[17px] w-[17px] stroke-[1.75]"
              aria-hidden
            />
            <span className="text-[var(--ed-muted)]">{dateLine}</span>
          </li>
          {event.location ? (
            <li className="flex gap-2.5 text-[13.5px]">
              <MapPin
                className="ed-icon-well mt-0.5 h-[17px] w-[17px] stroke-[1.75]"
                aria-hidden
              />
              <span className="min-w-0 text-[var(--ed-muted)]">
                <span className="text-[var(--ed-ink)]">{event.location}</span>
                {event.address ? (
                  <span className="mt-0.5 block text-[12px] leading-snug">{event.address}</span>
                ) : null}
              </span>
            </li>
          ) : null}
          <li className="flex gap-2.5 text-[13.5px]">
            <JapaneseYen
              className="ed-icon-well mt-0.5 h-[17px] w-[17px] stroke-[1.75]"
              aria-hidden
            />
            <span className="text-[var(--ed-muted)]">
              {priceLine}
              {priceSuffix ? ` ${priceSuffix}` : ""}
            </span>
          </li>
          <li className="flex gap-2.5 text-[13.5px]">
            <CircleUserRound
              className="ed-icon-well mt-0.5 h-[17px] w-[17px] stroke-[1.75]"
              aria-hidden
            />
            {organizerId && event.organizerName ? (
              <Link
                href={`/organizers/${organizerId}`}
                className="min-w-0 text-[var(--ed-muted)] underline-offset-2 hover:underline"
              >
                <span className="text-[var(--ed-ink)]">主催者</span>
                <span className="mt-0.5 block text-[12px]">{event.organizerName}</span>
              </Link>
            ) : (
              <span className="text-[var(--ed-muted)]">
                <span className="text-[var(--ed-ink)]">主催者</span>
                {event.organizerName ? (
                  <span className="mt-0.5 block text-[12px]">{event.organizerName}</span>
                ) : null}
              </span>
            )}
          </li>
        </ul>

        {isAvailable ? (
          <div className="flex items-center gap-2 rounded-[10px] bg-[var(--ed-warm)] px-3.5 py-2.5 text-[12.5px] font-medium text-[var(--ed-warm-ink)]">
            <CircleCheck className="h-4 w-4 shrink-0 text-[var(--ed-forest)]" aria-hidden />
            <span>
              {participationReception} / {receptionLabel}
            </span>
          </div>
        ) : null}

        {primaryActionsSlot ? (
          <div className="w-full">{primaryActionsSlot}</div>
        ) : null}

        <div className="grid grid-cols-3 gap-2">
          {mapsHref ? (
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="ed-sub-btn ed-sub-btn-map"
            >
              <span className="ed-sub-btn-icon">
                <MapPin className="h-[18px] w-[18px]" aria-hidden />
              </span>
              地図を開く
            </a>
          ) : (
            <span className="ed-sub-btn ed-sub-btn-map opacity-40" aria-disabled>
              <span className="ed-sub-btn-icon">
                <MapPin className="h-[18px] w-[18px]" aria-hidden />
              </span>
              地図を開く
            </span>
          )}
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ed-sub-btn ed-sub-btn-calendar"
          >
            <span className="ed-sub-btn-icon">
              <CalendarDays className="h-[18px] w-[18px]" aria-hidden />
            </span>
            カレンダーに追加
          </a>
          <button
            type="button"
            onClick={() => openConsult("question")}
            disabled={consultOpening}
            className="ed-sub-btn ed-sub-btn-chat disabled:opacity-50"
          >
            <span className="ed-sub-btn-icon">
              <MessageCircle className="h-[18px] w-[18px]" aria-hidden />
            </span>
            {consultOpening ? "準備中..." : "主催者に相談"}
          </button>
        </div>

        <div
          role="tablist"
          aria-label="イベントセクション"
          className="-mx-4 flex border-b border-[var(--ed-line)] px-4"
        >
          {MOBILE_TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "-mb-px shrink-0 border-b-2 px-4 py-3 text-[14px] transition-colors",
                tab === t
                  ? "border-[var(--ed-forest)] font-semibold text-[var(--ed-forest)]"
                  : "border-transparent font-medium text-[var(--ed-muted)]"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="ed-tab-panel -mx-4">
          {tab === "概要" ? <div>{overviewChildren}</div> : null}
          {tab === "参加方法" ? <div>{participationChildren}</div> : null}
          {tab === "Q&A" ? <div>{qnaChildren}</div> : null}
        </div>
      </div>
    </div>
  );
}
