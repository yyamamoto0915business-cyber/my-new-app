"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Link2, ChevronRight, MessageCircle } from "lucide-react";
import { useEventOrganizerConsult } from "@/app/events/[id]/event-organizer-consult-provider";
import type { EventRecurrence } from "@/lib/event-recurrence";
import type { Event } from "@/lib/db/types";
import { EventPurchaseCard } from "@/components/events/detail/purchase/EventPurchaseCard";

type Props = {
  event: Event;
  shareUrl: string;
  date: string;
  startTime: string;
  endTime?: string;
  recurrence?: EventRecurrence;
  recurrenceCount?: number | null;
  location: string;
  address?: string;
  receptionLabel: string;
  priceNote?: string | null;
  organizerId?: string;
  organizerAvatarUrl?: string;
  organizerBio?: string;
  organizerName: string;
  isAvailable: boolean;
};

export function EventDetailPcSidebar({
  event,
  shareUrl,
  date,
  startTime,
  endTime,
  recurrence = "none",
  recurrenceCount,
  location,
  address,
  receptionLabel,
  priceNote,
  organizerId,
  organizerAvatarUrl,
  organizerBio,
  organizerName,
  isAvailable,
}: Props) {
  const { openConsult, opening: consultOpening } = useEventOrganizerConsult();
  const [copyDone, setCopyDone] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const showAvatar = organizerAvatarUrl && !avatarError;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 1500);
    } catch {
      /* ignore */
    }
  }, [shareUrl]);

  const xUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`;

  return (
    <aside className="flex flex-col gap-2.5">
      {/* 主催者カード */}
      <div className="rounded-2xl border border-[#e8edd8] bg-white p-4">
        <div className="flex items-start gap-2.5">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[#c8d8b8]">
            {showAvatar ? (
              <Image
                src={organizerAvatarUrl!}
                alt=""
                fill
                className="object-cover"
                sizes="48px"
                unoptimized
                onError={() => setAvatarError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-base font-bold text-[#348b38]">
                {organizerName.slice(0, 1)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-[#1a2818]">{organizerName}</p>
            {organizerBio ? (
              <p className="mt-1.5 line-clamp-3 text-[12px] leading-[1.6] text-[#526448]">
                {organizerBio}
              </p>
            ) : null}
            {organizerId ? (
              <Link
                href={`/organizers/${organizerId}`}
                className="mt-2 inline-flex items-center gap-0.5 text-[12.5px] font-semibold text-[#348b38]"
              >
                主催者のプロフィールを見る
                <ChevronRight className="h-3.5 w-3.5 stroke-[2.2]" aria-hidden />
              </Link>
            ) : null}
          </div>
        </div>
        {isAvailable ? (
          <button
            type="button"
            onClick={() => openConsult("question")}
            disabled={consultOpening}
            className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-[#d5e5d6] bg-white text-[12.5px] font-semibold text-[#348b38] transition hover:bg-[#f4faf6] disabled:opacity-50"
          >
            <MessageCircle className="h-3.5 w-3.5" aria-hidden />
            {consultOpening ? "準備中..." : "メッセージを送る"}
          </button>
        ) : null}
      </div>

      <EventPurchaseCard
        event={event}
        date={date}
        startTime={startTime}
        endTime={endTime}
        recurrence={recurrence}
        recurrenceCount={recurrenceCount}
        location={location}
        address={address}
        priceNote={priceNote}
        receptionLabel={receptionLabel}
      />

      {/* シェアする（購入より控えめ） */}
      <div className="pt-0.5">
        <p className="mb-2 text-[12px] font-medium text-[#8a9e80]">シェアする</p>
        <div className="flex items-center gap-2">
          <a
            href={xUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Xでシェア"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/85 text-white transition hover:opacity-80"
          >
            <svg viewBox="0 0 24 24" className="h-[13px] w-[13px]" fill="currentColor" aria-hidden>
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a
            href={fbUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebookでシェア"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1877f2]/90 transition hover:opacity-80"
          >
            <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="#fff" aria-hidden>
              <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
            </svg>
          </a>
          <a
            href={lineUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LINEでシェア"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#06c755]/90 transition hover:opacity-80"
          >
            <svg viewBox="0 0 40 40" className="h-[17px] w-[17px]" fill="#fff" aria-hidden>
              <path d="M20 4C11.16 4 4 10.27 4 18c0 4.39 2.34 8.3 6.02 10.95L8.5 35l6.34-3.27A18.24 18.24 0 0020 32c8.84 0 16-6.27 16-14S28.84 4 20 4zm-5 18H9v-8h2v6h4v2zm3 0h-2V14h2v8zm8-4h-4v4h-2v-8h6v4z" />
            </svg>
          </a>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copyDone ? "コピーしました" : "リンクをコピー"}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e0e8d4] bg-[#f4f6f1] transition hover:opacity-80"
          >
            <Link2 className="h-[15px] w-[15px] stroke-[2] text-[#7a8c72]" aria-hidden />
          </button>
          {copyDone ? (
            <span className="text-[11.5px] font-medium text-[#8a9e80]">コピーしました</span>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
