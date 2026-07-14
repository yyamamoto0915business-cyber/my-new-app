"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, User, Hash } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  formatExpiresAt,
  formatPassDateRange,
  formatTicketQuantity,
  PAYMENT_STATUS_LABEL,
  type ParticipationPass,
} from "@/lib/participation-pass";
import {
  PassPaymentBadge,
  PassReceptionBadge,
} from "@/components/pass/PassBadges";

type Props = {
  pass: ParticipationPass | null;
  onClose: () => void;
  compact?: boolean;
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
  const rows = [
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

function QrConfirmBlock({ pass }: { pass: ParticipationPass }) {
  const value = pass.qrValue ?? pass.receptionNumber;

  return (
    <div className="flex flex-col items-center px-4 py-3">
      <div className="rounded-xl border border-[#e4ebe4] bg-white p-2 shadow-sm">
        <QRCodeSVG value={value} size={120} fgColor="#1a2818" bgColor="#ffffff" level="M" />
      </div>
      <p className="mt-2 text-center text-[11.5px] leading-snug text-[#4a584c]">
        受付でこの画面を提示してください
      </p>
      {pass.expiresAt && (
        <div className="mt-1.5 w-full max-w-[220px] rounded-lg border border-[#c8dece] bg-[#eef6f0] px-2.5 py-1 text-center text-[11px] font-medium text-[#2d7a4f]">
          有効期限 {formatExpiresAt(pass.expiresAt)}
        </div>
      )}
    </div>
  );
}

export function PassDetailPanel({ pass, onClose, compact = false }: Props) {
  if (!pass) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-[#d8e2d8] bg-white/70 px-5 text-center">
        <div>
          <p className="text-[13px] font-medium text-[#3a4840]">参加パスを選択してください</p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[#6a7468]">
            一覧からパスを選ぶと、こちらに詳細が表示されます
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col">
      {!compact && (
        <div className="mb-1.5 shrink-0">
          <h2 className="text-[13.5px] font-semibold text-[#1a2818]">選択中の参加パス</h2>
          <p className="mt-0.5 text-[11px] leading-snug text-[#6a7468]">
            一覧ではシンプルに、開くとQRコードを大きく表示
          </p>
        </div>
      )}

      <div className="relative flex flex-col overflow-hidden rounded-2xl border border-[#dce8de] bg-white shadow-[0_6px_20px_rgba(40,60,48,0.07)]">
        <DetailNotches />

        <div className="relative h-[180px] w-full shrink-0 overflow-hidden bg-[#eef2ee]">
          <Image
            src={pass.eventImage}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 900px) 100vw, 400px"
            priority
          />
        </div>

        <div className="shrink-0 space-y-1.5 px-4 pt-3">
          <h3 className="text-[14.5px] font-semibold leading-snug text-[#1a2818]">
            {pass.eventTitle}
          </h3>
          <p className="flex items-center gap-1.5 text-[11.5px] text-[#5a665c]">
            <CalendarDays className="h-3 w-3 shrink-0 text-[#6a8a72]" aria-hidden />
            <span className="truncate">{formatPassDateRange(pass.startAt, pass.endAt)}</span>
          </p>
          <p className="flex items-center gap-1.5 text-[11.5px] text-[#5a665c]">
            <MapPin className="h-3 w-3 shrink-0 text-[#6a8a72]" aria-hidden />
            <span className="truncate">{pass.venueName}</span>
          </p>

          <div className="flex flex-wrap gap-x-3 gap-y-0.5 border-t border-[#eef2ee] pt-2 text-[11.5px]">
            <p className="flex items-center gap-1 text-[#3a4840]">
              <User className="h-3 w-3 text-[#6a8a72]" aria-hidden />
              <span className="text-[#6a7468]">参加者</span>
              <span className="font-semibold">{pass.attendeeName}</span>
            </p>
            <p className="flex items-center gap-1 text-[#3a4840]">
              <Hash className="h-3 w-3 text-[#6a8a72]" aria-hidden />
              <span className="text-[#6a7468]">受付番号</span>
              <span className="font-semibold tracking-wide">{pass.receptionNumber}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-1 pb-0.5">
            <PassPaymentBadge status={pass.paymentStatus} />
            <PassReceptionBadge type={pass.receptionType} />
          </div>
        </div>

        <div className="relative mx-3 my-0.5 shrink-0 border-t border-dashed border-[#c8d8cc]" aria-hidden />

        {pass.receptionType === "qr" ? (
          <QrConfirmBlock pass={pass} />
        ) : (
          <StaffConfirmBlock pass={pass} />
        )}
      </div>

      <div className="mt-2 flex shrink-0 gap-2">
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
