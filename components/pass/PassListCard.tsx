"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, CalendarDays } from "lucide-react";
import {
  formatDaysUntilLabel,
  formatPassDateRange,
  formatTicketQuantity,
  getDaysUntil,
  isOnlineOnlyPass,
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
function TicketNotches({ featured }: { featured: boolean }) {
  return (
    <>
      <span
        className={[
          "pointer-events-none absolute top-0 z-10 h-2.5 w-2.5 rounded-full bg-[var(--mg-paper,#faf9f6)] ring-1 ring-[#e0e8e0] min-[900px]:h-3 min-[900px]:w-3",
          featured
            ? "right-[108px] min-[900px]:right-[120px]"
            : "right-[100px] min-[900px]:right-[104px]",
        ].join(" ")}
        style={{ transform: "translate(50%, -50%)" }}
        aria-hidden
      />
      <span
        className={[
          "pointer-events-none absolute bottom-0 z-10 h-2.5 w-2.5 rounded-full bg-[var(--mg-paper,#faf9f6)] ring-1 ring-[#e0e8e0] min-[900px]:h-3 min-[900px]:w-3",
          featured
            ? "right-[108px] min-[900px]:right-[120px]"
            : "right-[100px] min-[900px]:right-[104px]",
        ].join(" ")}
        style={{ transform: "translate(50%, 50%)" }}
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
  const formatLabel =
    pass.eventFormat === "online"
      ? "オンライン"
      : pass.eventFormat === "hybrid"
        ? "ハイブリッド"
        : null;

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
      <TicketNotches featured={isFeatured} />

      <div
        className={[
          "grid items-stretch",
          isFeatured
            ? "grid-cols-[78px_minmax(0,1fr)_108px] min-[900px]:grid-cols-[88px_minmax(0,1fr)_120px]"
            : "grid-cols-[64px_minmax(0,1fr)_100px] min-[900px]:grid-cols-[64px_minmax(0,1fr)_104px]",
        ].join(" ")}
      >
        {/* 画像 */}
        <button
          type="button"
          onClick={onSelect}
          className={[
            "relative shrink-0 self-stretch overflow-hidden text-left",
            isFeatured
              ? "min-h-[78px] min-[900px]:min-h-[86px]"
              : "min-h-[68px] min-[900px]:min-h-[72px]",
          ].join(" ")}
          aria-label={`${pass.eventTitle}を選択`}
        >
          <Image
            src={pass.eventImage}
            alt=""
            fill
            className="object-cover"
            sizes={isFeatured ? "(max-width:899px) 78px, 88px" : "(max-width:899px) 64px, 64px"}
          />
        </button>

        {/* 情報 */}
        <button
          type="button"
          onClick={onSelect}
          className={[
            "min-w-0 text-left",
            isFeatured
              ? "px-2.5 py-2 min-[900px]:px-3"
              : "px-2 py-2 min-[900px]:px-2.5",
          ].join(" ")}
        >
          <h3
            className={[
              "line-clamp-1 font-semibold text-[#1a2818]",
              isFeatured
                ? "text-[13.5px] leading-snug"
                : "text-[12.5px] leading-snug",
            ].join(" ")}
          >
            {pass.eventTitle}
          </h3>

          {/* モバイル: 日時・場所を分かれて読みやすく（PCと同じ2行） */}
          <p
            className={`mt-1 flex items-center gap-1 text-[#5a665c] ${
              isFeatured ? "text-[11px]" : "text-[10.5px]"
            }`}
          >
            <CalendarDays className="h-3 w-3 shrink-0 text-[#6a8a72]" aria-hidden />
            <span className="truncate">{formatPassDateRange(pass.startAt, pass.endAt)}</span>
          </p>
          <p
            className={`mt-0.5 flex items-center gap-1 text-[#5a665c] ${
              isFeatured ? "text-[11px]" : "text-[10.5px]"
            }`}
          >
            <MapPin className="h-3 w-3 shrink-0 text-[#6a8a72]" aria-hidden />
            <span className="truncate">{pass.venueName}</span>
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <PassKindBadge kind={pass.kind} />
            {pass.kind === "volunteer" ? null : (
              <PassPaymentBadge status={pass.paymentStatus} />
            )}
            {isOnlineOnlyPass(pass) ? (
              <span className="inline-flex shrink-0 items-center rounded-full border border-[#c8d0e0] bg-[#f0f2f8] px-1.5 py-0.5 text-[10.5px] font-medium text-[#3a4a68]">
                オンライン参加
              </span>
            ) : (
              <PassReceptionBadge type={pass.receptionType} />
            )}
            <span className="hidden min-[900px]:inline-flex">
              <PassQuantityBadge label={formatTicketQuantity(pass)} />
            </span>
            {formatLabel ? (
              <span className="inline-flex shrink-0 items-center rounded-full bg-[#eef8e8] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#3a7a10]">
                <span className="min-[900px]:hidden">{formatLabel}</span>
                <span className="hidden min-[900px]:inline">
                  {pass.eventFormat === "online" ? "オンライン開催" : "ハイブリッド開催"}
                </span>
              </span>
            ) : null}
          </div>
        </button>

        {/* 操作エリア */}
        <div
          className={[
            "relative flex flex-col items-stretch justify-center border-l border-dashed border-[#c8d8cc]",
            isFeatured
              ? "gap-1 px-2 py-2 min-[900px]:px-2.5"
              : "gap-1 px-1.5 py-2 min-[900px]:px-2",
          ].join(" ")}
        >
          <span
            className={`inline-flex self-start rounded-full px-2 py-0.5 text-[10px] font-semibold ${
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
            className={[
              "inline-flex items-center justify-center gap-0.5 rounded-lg bg-[#1e3848] font-semibold text-white transition hover:bg-[#162c38]",
              isFeatured
                ? "h-7 px-2 text-[11.5px]"
                : "h-[28px] px-1.5 text-[11px]",
            ].join(" ")}
          >
            パスを開く
            <ArrowRight className="h-3 w-3" aria-hidden />
          </button>
          <Link
            href={`/events/${pass.eventId}`}
            onClick={(e) => e.stopPropagation()}
            className="hidden items-center gap-0.5 text-[10.5px] font-medium text-[#2d7a4f] transition hover:underline min-[900px]:inline-flex"
          >
            イベント詳細
            <ArrowRight className="h-2.5 w-2.5" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}
