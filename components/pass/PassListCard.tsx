"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, CalendarDays } from "lucide-react";
import {
  formatDaysUntilLabel,
  formatPassDateRange,
  formatTicketQuantity,
  getDaysUntil,
  type ParticipationPass,
} from "@/lib/participation-pass";
import {
  PassKindBadge,
  PassPaymentBadge,
  PassQuantityBadge,
  PassReceptionBadge,
} from "@/components/pass/PassBadges";

type Props = {
  pass: ParticipationPass;
  selected: boolean;
  size: "featured" | "compact";
  onSelect: () => void;
  onOpenPass: () => void;
};

/** ミシン目位置（右端操作エリア）の上下に切り欠き */
function TicketNotches({ actionWidth }: { actionWidth: number }) {
  return (
    <>
      <span
        className="pointer-events-none absolute top-0 z-10 h-3.5 w-3.5 rounded-full bg-[var(--mg-paper,#faf9f6)] ring-1 ring-[#e0e8e0]"
        style={{ right: actionWidth, transform: "translate(50%, -50%)" }}
        aria-hidden
      />
      <span
        className="pointer-events-none absolute bottom-0 z-10 h-3.5 w-3.5 rounded-full bg-[var(--mg-paper,#faf9f6)] ring-1 ring-[#e0e8e0]"
        style={{ right: actionWidth, transform: "translate(50%, 50%)" }}
        aria-hidden
      />
    </>
  );
}

export function PassListCard({
  pass,
  selected,
  size,
  onSelect,
  onOpenPass,
}: Props) {
  const isFeatured = size === "featured";
  const days = getDaysUntil(pass.startAt);
  const daysLabel = formatDaysUntilLabel(days);
  const actionWidth = isFeatured ? 132 : 112;
  const imageWidth = isFeatured ? 108 : 72;

  return (
    <article
      className={[
        "group relative overflow-hidden rounded-xl border transition duration-200",
        selected
          ? "border-[#7cbc90] bg-[#f3faf5] shadow-[0_4px_16px_rgba(47,143,87,0.10)]"
          : "border-[#e2ebe4] bg-white hover:-translate-y-0.5 hover:border-[#c5dccb] hover:shadow-[0_6px_18px_rgba(40,60,48,0.07)]",
        isFeatured ? "bg-gradient-to-br from-[#f4faf6] to-white" : "",
      ].join(" ")}
    >
      <TicketNotches actionWidth={actionWidth} />

      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-stretch">
        {/* 画像 */}
        <button
          type="button"
          onClick={onSelect}
          className="relative shrink-0 self-stretch overflow-hidden text-left"
          aria-label={`${pass.eventTitle}を選択`}
          style={{
            width: imageWidth,
            minHeight: isFeatured ? 104 : 84,
          }}
        >
          <Image
            src={pass.eventImage}
            alt=""
            fill
            className="object-cover"
            sizes={`${imageWidth}px`}
          />
        </button>

        {/* 情報 */}
        <button
          type="button"
          onClick={onSelect}
          className={`min-w-0 text-left ${isFeatured ? "px-3.5 py-3" : "px-3 py-2.5"}`}
        >
          <h3
            className={`line-clamp-1 font-semibold text-[#1a2818] ${
              isFeatured ? "text-[14.5px] leading-snug" : "text-[13px] leading-snug"
            }`}
          >
            {pass.eventTitle}
          </h3>
          <p
            className={`mt-1 flex items-center gap-1.5 text-[#5a665c] ${
              isFeatured ? "text-[11.5px]" : "text-[11px]"
            }`}
          >
            <CalendarDays className="h-3 w-3 shrink-0 text-[#6a8a72]" aria-hidden />
            <span className="truncate">{formatPassDateRange(pass.startAt, pass.endAt)}</span>
          </p>
          <p
            className={`mt-0.5 flex items-center gap-1.5 text-[#5a665c] ${
              isFeatured ? "text-[11.5px]" : "text-[11px]"
            }`}
          >
            <MapPin className="h-3 w-3 shrink-0 text-[#6a8a72]" aria-hidden />
            <span className="truncate">{pass.venueName}</span>
          </p>
          <div className={`flex flex-wrap gap-1 ${isFeatured ? "mt-2" : "mt-1.5"}`}>
            <PassKindBadge kind={pass.kind} />
            {pass.kind === "volunteer" ? null : (
              <PassPaymentBadge status={pass.paymentStatus} />
            )}
            <PassReceptionBadge type={pass.receptionType} />
            <PassQuantityBadge label={formatTicketQuantity(pass)} />
          </div>
        </button>

        {/* 操作エリア */}
        <div
          className={`relative flex flex-col items-stretch justify-center border-l border-dashed border-[#c8d8cc] ${
            isFeatured ? "gap-1.5 px-3 py-3" : "gap-1.5 px-2.5 py-2.5"
          }`}
          style={{ width: actionWidth }}
        >
          <span
            className={`inline-flex self-start rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
              days >= 0 ? "bg-[#e4f3e8] text-[#2d7a4f]" : "bg-[#f0f0ee] text-[#6a6a64]"
            }`}
          >
            {daysLabel}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenPass();
            }}
            className={`inline-flex items-center justify-center gap-0.5 rounded-lg bg-[#1e3848] font-semibold text-white transition hover:bg-[#162c38] ${
              isFeatured ? "h-8 px-2.5 text-[12px]" : "h-[30px] px-2 text-[11.5px]"
            }`}
          >
            パスを開く
            <ArrowRight className="h-3 w-3" aria-hidden />
          </button>
          <Link
            href={`/events/${pass.eventId}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[#2d7a4f] transition hover:underline"
          >
            イベント詳細
            <ArrowRight className="h-2.5 w-2.5" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}
