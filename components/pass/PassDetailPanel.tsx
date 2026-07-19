"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Hash, MapPin, User } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  formatExpiresAt,
  formatPassDateRange,
  formatTicketQuantity,
  isHybridPass,
  isOnlineOnlyPass,
  PAYMENT_STATUS_LABEL,
  type ParticipationPass,
} from "@/lib/participation-pass";
import {
  PassKindBadge,
  PassPaymentBadge,
  PassReceptionBadge,
} from "@/components/pass/PassBadges";
import { PassOnlineJoinSection } from "@/components/pass/PassOnlineJoinSection";
import type { EventOnlineAccessResponse } from "@/lib/event-online";

type Props = {
  pass: ParticipationPass | null;
  onClose: () => void;
  compact?: boolean;
  emptyMessage?: {
    title: string;
    description: string;
  };
  /** デモ用オンライン参加情報（指定時は API を使わない） */
  demoAccess?: EventOnlineAccessResponse | null;
};

function DetailNotches() {
  return (
    <>
      <span
        className="pointer-events-none absolute left-0 top-[44%] z-10 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--mg-paper,#faf9f6)] ring-1 ring-[#e0e8e0]"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute right-0 top-[44%] z-10 h-3.5 w-3.5 translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--mg-paper,#faf9f6)] ring-1 ring-[#e0e8e0]"
        aria-hidden
      />
    </>
  );
}

function StaffConfirmBlock({ pass }: { pass: ParticipationPass }) {
  const isVolunteer = pass.kind === "volunteer";
  const rows = isVolunteer
    ? [
        { label: "スタッフ名", value: pass.attendeeName },
        { label: "受付番号", value: pass.receptionNumber },
        { label: "担当", value: formatTicketQuantity(pass) },
      ]
    : [
        { label: "参加者名", value: pass.attendeeName },
        { label: "受付番号", value: pass.receptionNumber },
        { label: "申込人数", value: formatTicketQuantity(pass) },
        { label: "支払い状況", value: PAYMENT_STATUS_LABEL[pass.paymentStatus] },
      ];

  return (
    <div className="space-y-2 px-4 py-3">
      <div className="rounded-xl border border-[#dce8de] bg-[#f7fbf8] p-3">
        <ul className="space-y-1.5">
          {rows.map((row) => (
            <li key={row.label} className="flex items-baseline justify-between gap-3">
              <span className="shrink-0 text-[11px] text-[#6a7468]">{row.label}</span>
              <span className="text-right text-[12.5px] font-semibold text-[#1a2818]">
                {row.value}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-center text-[11.5px] leading-snug text-[#4a584c]">
        受付スタッフにこの画面を提示してください
      </p>
    </div>
  );
}

function QrConfirmBlock({
  pass,
  compact = false,
}: {
  pass: ParticipationPass;
  compact?: boolean;
}) {
  const value = pass.qrValue ?? pass.receptionNumber;
  const size = compact ? 72 : 120;

  return (
    <div
      className={`flex flex-col items-center ${
        compact ? "px-3 py-1.5" : "px-4 py-3"
      }`}
    >
      <div
        className={`rounded-xl border border-[#e4ebe4] bg-white shadow-sm ${
          compact ? "p-1.5" : "p-2"
        }`}
      >
        <QRCodeSVG value={value} size={size} fgColor="#1a2818" bgColor="#ffffff" level="M" />
      </div>
      <p
        className={`text-center leading-snug text-[#4a584c] ${
          compact ? "mt-1 text-[10.5px]" : "mt-2 text-[11.5px]"
        }`}
      >
        {compact ? "現地受付で提示" : "受付でこの画面を提示してください"}
      </p>
      {pass.expiresAt && (
        <div
          className={`border border-[#c8dece] bg-[#eef6f0] text-center font-medium text-[#2d7a4f] ${
            compact
              ? "mt-1 rounded-full px-2 py-0.5 text-[10px]"
              : "mt-1.5 w-full max-w-[220px] rounded-lg px-2.5 py-1 text-[11px]"
          }`}
        >
          有効期限 {formatExpiresAt(pass.expiresAt)}
        </div>
      )}
    </div>
  );
}

function OnlineConfirmHint({ expiresAt }: { expiresAt?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
      <p className="text-[11px] leading-snug text-[#4a584c]">
        現地受付は不要です。参加リンクからご参加ください
      </p>
      {expiresAt ? (
        <span className="shrink-0 rounded-full border border-[#c8dece] bg-[#eef6f0] px-2 py-0.5 text-[10.5px] font-medium text-[#2d7a4f]">
          有効期限 {formatExpiresAt(expiresAt)}
        </span>
      ) : null}
    </div>
  );
}

export function PassDetailPanel({
  pass,
  onClose,
  compact = false,
  emptyMessage,
  demoAccess,
}: Props) {
  if (!pass) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-[#d8e2d8] bg-white/70 px-5 text-center">
        <div>
          <p className="text-[13px] font-medium text-[#3a4840]">
            {emptyMessage?.title ?? "参加パスを選択してください"}
          </p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[#6a7468]">
            {emptyMessage?.description ??
              "一覧からパスを選ぶと、こちらに詳細が表示されます"}
          </p>
        </div>
      </div>
    );
  }

  const onlineOnly = isOnlineOnlyPass(pass);
  const hybrid = isHybridPass(pass);
  const denseLayout = onlineOnly || hybrid;

  return (
    <div className="flex min-h-0 flex-col">
      {!compact && (
        <div className="mb-1 shrink-0">
          <h2 className="text-[13px] font-semibold text-[#1a2818]">選択中の参加パス</h2>
          <p className="mt-0.5 text-[10.5px] leading-snug text-[#6a7468]">
            {onlineOnly
              ? "オンライン開催のため、参加リンクからご参加ください"
              : hybrid
                ? "現地はQR、オンラインは参加リンクからご参加ください"
                : "一覧ではシンプルに、開くとQRコードを大きく表示"}
          </p>
        </div>
      )}

      <div className="relative flex flex-col overflow-hidden rounded-2xl border border-[#dce8de] bg-white shadow-[0_6px_20px_rgba(40,60,48,0.07)]">
        <DetailNotches />

        <div
          className={`relative w-full shrink-0 overflow-hidden bg-[#eef2ee] ${
            onlineOnly ? "h-[88px]" : hybrid ? "h-[100px]" : "h-[180px]"
          }`}
        >
          <Image
            src={pass.eventImage}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 900px) 100vw, 400px"
            priority
          />
        </div>

        <div className={`shrink-0 px-4 ${denseLayout ? "space-y-1 pt-2.5 pb-1" : "space-y-1.5 pt-3"}`}>
          <h3
            className={`font-semibold leading-snug text-[#1a2818] ${
              denseLayout ? "text-[13.5px]" : "text-[14.5px]"
            }`}
          >
            {pass.eventTitle}
          </h3>
          <div
            className={`flex flex-wrap gap-x-3 gap-y-0.5 text-[#5a665c] ${
              denseLayout ? "text-[11px]" : "text-[11.5px]"
            }`}
          >
            <p className="flex min-w-0 items-center gap-1">
              <CalendarDays className="h-3 w-3 shrink-0 text-[#6a8a72]" aria-hidden />
              <span className="truncate">{formatPassDateRange(pass.startAt, pass.endAt)}</span>
            </p>
            <p className="flex min-w-0 items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0 text-[#6a8a72]" aria-hidden />
              <span className="truncate">{pass.venueName}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-0.5 border-t border-[#eef2ee] pt-1.5 text-[11px]">
            <p className="flex items-center gap-1 text-[#3a4840]">
              <User className="h-3 w-3 text-[#6a8a72]" aria-hidden />
              <span className="font-semibold">{pass.attendeeName}</span>
            </p>
            <p className="flex items-center gap-1 text-[#3a4840]">
              <Hash className="h-3 w-3 text-[#6a8a72]" aria-hidden />
              <span className="font-semibold tracking-wide">{pass.receptionNumber}</span>
            </p>
            {!denseLayout && pass.kind === "volunteer" && pass.roleLabel ? (
              <p className="flex items-center gap-1 text-[#3a4840]">
                <span className="text-[#6a7468]">担当</span>
                <span className="font-semibold">{pass.roleLabel}</span>
              </p>
            ) : null}
            {denseLayout ? (
              <p className="text-[#6a7468]">
                {formatTicketQuantity(pass)} · {PAYMENT_STATUS_LABEL[pass.paymentStatus]}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-1 pb-0.5">
            <PassKindBadge kind={pass.kind} />
            {pass.kind === "volunteer" || denseLayout ? null : (
              <PassPaymentBadge status={pass.paymentStatus} />
            )}
            {onlineOnly ? (
              <span className="inline-flex items-center rounded-full border border-[#c8d0e0] bg-[#f0f2f8] px-1.5 py-0.5 text-[10.5px] font-medium text-[#3a4a68]">
                オンライン参加
              </span>
            ) : (
              <PassReceptionBadge type={pass.receptionType} />
            )}
            {pass.eventFormat === "online" || pass.eventFormat === "hybrid" ? (
              <span className="inline-flex items-center rounded-full bg-[#eef8e8] px-2 py-0.5 text-[10px] font-semibold text-[#3a7a10]">
                {pass.eventFormat === "online" ? "オンライン開催" : "ハイブリッド開催"}
              </span>
            ) : null}
          </div>
        </div>

        <div className="relative mx-3 my-0.5 shrink-0 border-t border-dashed border-[#c8d8cc]" aria-hidden />

        {onlineOnly ? (
          <>
            <OnlineConfirmHint expiresAt={pass.expiresAt} />
            <div className="border-t border-[#eef2ee] px-3 pb-3 pt-1">
              <PassOnlineJoinSection
                pass={pass}
                organizerContact={pass.organizerContact}
                demoAccess={demoAccess}
                dense
                embedded
              />
            </div>
          </>
        ) : hybrid ? (
          <>
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="shrink-0 rounded-lg border border-[#e4ebe4] bg-white p-1 shadow-sm">
                <QRCodeSVG
                  value={pass.qrValue ?? pass.receptionNumber}
                  size={64}
                  fgColor="#1a2818"
                  bgColor="#ffffff"
                  level="M"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11.5px] font-medium text-[#3a4840]">現地受付用QR</p>
                <p className="mt-0.5 text-[10.5px] leading-snug text-[#6a7468]">
                  会場ではこのQRを提示してください
                </p>
                {pass.expiresAt ? (
                  <p className="mt-1 text-[10px] font-medium text-[#2d7a4f]">
                    有効期限 {formatExpiresAt(pass.expiresAt)}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="border-t border-dashed border-[#e0e8e0] px-3 pb-2.5 pt-2">
              <PassOnlineJoinSection
                pass={pass}
                organizerContact={pass.organizerContact}
                demoAccess={demoAccess}
                dense
                embedded
              />
            </div>
          </>
        ) : pass.receptionType === "qr" ? (
          <QrConfirmBlock pass={pass} />
        ) : (
          <StaffConfirmBlock pass={pass} />
        )}
      </div>

      {!onlineOnly && !hybrid ? (
        <div className="mt-2.5 shrink-0">
          <PassOnlineJoinSection
            pass={pass}
            organizerContact={pass.organizerContact}
            demoAccess={demoAccess}
          />
        </div>
      ) : null}

      <div className={`flex shrink-0 gap-2 ${denseLayout ? "mt-1.5" : "mt-2"}`}>
        <Link
          href={`/events/${pass.eventId}`}
          className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-xl bg-[#1e3848] text-[12.5px] font-semibold text-white transition hover:bg-[#162c38]"
        >
          イベント詳細
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 flex-1 items-center justify-center rounded-xl border border-[#d0dcd2] bg-white text-[12.5px] font-medium text-[#3a4840] transition hover:bg-[#f4f8f5]"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
