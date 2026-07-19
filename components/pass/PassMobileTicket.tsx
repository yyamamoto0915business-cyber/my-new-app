"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Leaf,
  MapPin,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  formatExpiresAt,
  formatPassDateRange,
  formatTicketQuantity,
  isHybridPass,
  isOnlineOnlyPass,
  PAYMENT_STATUS_LABEL,
  RECEPTION_TYPE_LABEL,
  type ParticipationPass,
} from "@/lib/participation-pass";
import { PassOnlineJoinSection } from "@/components/pass/PassOnlineJoinSection";
import type { EventOnlineAccessResponse } from "@/lib/event-online";

type Props = {
  pass: ParticipationPass;
  onClose: () => void;
  demoAccess?: EventOnlineAccessResponse | null;
};

const TICKET_BG = "/assets/machiglyph/pass/pass-ticket-bg.png";

/** モバイル用参加パスタイケット — 1画面に収まるコンパクト構成 */
export function PassMobileTicket({ pass, onClose, demoAccess }: Props) {
  const qrValue = pass.qrValue ?? pass.receptionNumber;
  const onlineOnly = isOnlineOnlyPass(pass);
  const hybrid = isHybridPass(pass);
  const unifiedTicket = onlineOnly || hybrid;

  return (
    <div className="flex max-h-full min-h-0 w-full flex-col">
      <article
        className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_12px_40px_rgba(40,60,48,0.18)]"
        style={{
          backgroundImage: `linear-gradient(180deg, #ffffff 0%, #ffffff 46%, rgba(255,255,255,0.93) 58%, rgba(255,255,255,0.85) 100%), url(${TICKET_BG})`,
          backgroundSize: "100% 100%, cover",
          backgroundPosition: "center, center 78%",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* 切り欠き */}
        <span
          className={`pointer-events-none absolute left-0 z-20 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2a322c] ${
            unifiedTicket ? "top-[28%]" : "top-[40%]"
          }`}
          aria-hidden
        />
        <span
          className={`pointer-events-none absolute right-0 z-20 h-[18px] w-[18px] translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2a322c] ${
            unifiedTicket ? "top-[28%]" : "top-[40%]"
          }`}
          aria-hidden
        />

        {/* 画像 */}
        <div
          className={`relative w-full shrink-0 overflow-hidden ${
            unifiedTicket ? "h-[100px]" : "h-[152px] sm:h-[164px]"
          }`}
        >
          <Image
            src={pass.eventImage}
            alt=""
            fill
            className="object-cover"
            sizes="400px"
            priority
          />
          <div className="absolute inset-y-0 left-0 flex w-[62%] max-w-[230px] items-end bg-gradient-to-r from-[#164a32]/95 via-[#164a32]/70 to-transparent pb-3 pl-3.5 pr-5">
            <div className="min-w-0 text-white">
              <Leaf className="mb-1 h-3.5 w-3.5 opacity-90" aria-hidden />
              <p className="line-clamp-2 text-[14px] font-bold leading-snug">
                {pass.eventTitle}
              </p>
            </div>
          </div>
        </div>

        {/* 情報 */}
        <div
          className={`relative z-10 shrink-0 px-3.5 ${
            unifiedTicket ? "space-y-1.5 pb-1.5 pt-2.5" : "space-y-2 pb-2.5 pt-3"
          }`}
        >
          <p className="flex items-center gap-1.5 text-[12px] text-[#3a4840]">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#4a9a68]" aria-hidden />
            <span className="truncate">{formatPassDateRange(pass.startAt, pass.endAt)}</span>
          </p>
          <p className="flex items-center gap-1.5 text-[12px] text-[#3a4840]">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#4a9a68]" aria-hidden />
            <span className="truncate">{pass.venueName}</span>
          </p>

          <div className="rounded-lg bg-[#f2f4f1] px-2.5 py-1.5 text-[12px] leading-snug text-[#2a3a30]">
            <span className="font-semibold">{pass.attendeeName}</span>
            <span className="mx-1.5 text-[#c5cdc5]">·</span>
            <span className="font-semibold tracking-wide">{pass.receptionNumber}</span>
            {unifiedTicket ? (
              <>
                <span className="mx-1.5 text-[#c5cdc5]">·</span>
                <span className="text-[#6a7468]">
                  {formatTicketQuantity(pass)} · {PAYMENT_STATUS_LABEL[pass.paymentStatus]}
                </span>
              </>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-1">
            {pass.kind === "volunteer" ? (
              <span className="inline-flex items-center rounded-full border border-[#c8b8e0] bg-[#f5f0fa] px-2 py-0.5 text-[11px] font-medium text-[#6b4a9e]">
                ボランティア
              </span>
            ) : unifiedTicket ? null : (
              <span className="inline-flex items-center gap-0.5 rounded-full border border-[#b8dcc8] bg-[#eef6f0] px-2 py-0.5 text-[11px] font-medium text-[#2d7a4f]">
                <Check className="h-2.5 w-2.5" aria-hidden />
                {PAYMENT_STATUS_LABEL[pass.paymentStatus]}
              </span>
            )}
            {onlineOnly ? (
              <span className="inline-flex items-center rounded-full border border-[#c8d0e0] bg-[#f0f2f8] px-2 py-0.5 text-[11px] font-medium text-[#3a4a68]">
                オンライン参加
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-[#b8dcc8] bg-[#eef6f0] px-2 py-0.5 text-[11px] font-medium text-[#2d7a4f]">
                {RECEPTION_TYPE_LABEL[pass.receptionType]}
              </span>
            )}
            {unifiedTicket ? null : (
              <span className="inline-flex items-center rounded-full border border-[#d8ddd8] bg-white/80 px-2 py-0.5 text-[11px] font-medium text-[#5a625a]">
                {formatTicketQuantity(pass)}
              </span>
            )}
            {pass.eventFormat === "online" || pass.eventFormat === "hybrid" ? (
              <span className="inline-flex items-center rounded-full border border-[#b8dcc8] bg-[#eef6f0] px-2 py-0.5 text-[11px] font-medium text-[#2d7a4f]">
                {pass.eventFormat === "online" ? "オンライン開催" : "ハイブリッド開催"}
              </span>
            ) : null}
          </div>
        </div>

        <div className="relative z-10 mx-4 shrink-0 border-t border-dashed border-[#c5cfc5]" aria-hidden />

        {/* 受付＋オンライン：1枚のチケット内にまとめる */}
        {onlineOnly ? (
          <div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-3.5 pb-3 pt-2">
            <p className="mb-2 text-center text-[11px] text-[#4a584c]">
              現地受付は不要です。参加リンクからご参加ください
            </p>
            {pass.expiresAt ? (
              <div className="mx-auto mb-2 w-fit rounded-full border border-[#c8dece] bg-[#eef6f0] px-2.5 py-0.5 text-[10.5px] font-medium text-[#2d7a4f]">
                有効期限 {formatExpiresAt(pass.expiresAt)}
              </div>
            ) : null}
            <PassOnlineJoinSection
              pass={pass}
              organizerContact={pass.organizerContact}
              demoAccess={demoAccess}
              dense
              embedded
            />
          </div>
        ) : hybrid ? (
          <div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-3.5 pb-3 pt-2">
            <div className="mb-2 flex items-center gap-3">
              <div className="shrink-0 rounded-lg border border-[#e4ebe4] bg-white p-1 shadow-sm">
                <QRCodeSVG
                  value={qrValue}
                  size={64}
                  fgColor="#1a2818"
                  bgColor="#ffffff"
                  level="M"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-[#3a4840]">現地受付用QR</p>
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
            <div className="mb-2 border-t border-dashed border-[#e0e8e0]" aria-hidden />
            <PassOnlineJoinSection
              pass={pass}
              organizerContact={pass.organizerContact}
              demoAccess={demoAccess}
              dense
              embedded
            />
          </div>
        ) : pass.receptionType === "qr" ? (
          <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-3 py-3.5">
            <div className="rounded-xl border border-[#e4ebe4] bg-white p-2.5 shadow-sm">
              <QRCodeSVG
                value={qrValue}
                size={128}
                fgColor="#1a2818"
                bgColor="#ffffff"
                level="M"
              />
            </div>
            <p className="mt-2 text-center text-[11.5px] leading-snug text-[#4a584c]">
              受付でこの画面を提示してください
            </p>
            {pass.expiresAt && (
              <div className="mt-1.5 rounded-full border border-[#c8dece] bg-[#eef6f0] px-2.5 py-1 text-[11px] font-medium text-[#2d7a4f]">
                有効期限 {formatExpiresAt(pass.expiresAt)}
              </div>
            )}
          </div>
        ) : (
          <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-center space-y-2 px-3.5 py-2.5">
            <div className="rounded-xl border border-[#dce8de] bg-white/90 p-3 shadow-sm">
              <ul className="space-y-1.5">
                {[
                  { label: "参加者名", value: pass.attendeeName },
                  { label: "受付番号", value: pass.receptionNumber },
                  { label: "申込人数", value: formatTicketQuantity(pass) },
                  { label: "支払い状況", value: PAYMENT_STATUS_LABEL[pass.paymentStatus] },
                ].map((row) => (
                  <li key={row.label} className="flex justify-between gap-3 text-[12px]">
                    <span className="text-[#6a7468]">{row.label}</span>
                    <span className="font-semibold text-[#1a2818]">{row.value}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-center text-[11px] text-[#4a584c]">
              受付スタッフにこの画面を提示してください
            </p>
          </div>
        )}
      </article>

      {!unifiedTicket ? (
        <div className="mt-2.5 max-h-[40vh] shrink-0 overflow-y-auto">
          <PassOnlineJoinSection
            pass={pass}
            organizerContact={pass.organizerContact}
            demoAccess={demoAccess}
          />
        </div>
      ) : null}

      <div className="mt-3 flex shrink-0 gap-2">
        <Link
          href={`/events/${pass.eventId}`}
          className="inline-flex h-11 flex-1 items-center justify-center gap-1 rounded-xl bg-[#1e3848] text-[13px] font-semibold text-white"
        >
          イベント詳細
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border-[1.5px] border-[#2d7a4f] bg-white text-[13px] font-semibold text-[#2d7a4f]"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
