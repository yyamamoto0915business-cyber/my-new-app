"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PassDetailPanel } from "@/components/pass/PassDetailPanel";
import { PassMobileTicket } from "@/components/pass/PassMobileTicket";
import type { EventFormat, EventOnlineAccessResponse } from "@/lib/event-online";
import type { ParticipationPass } from "@/lib/participation-pass";

type LinkPhase = "waiting" | "visible";

function buildDemoPass(format: EventFormat): ParticipationPass {
  const start = new Date();
  start.setHours(start.getHours() + 2, 0, 0, 0);
  const end = new Date(start);
  end.setHours(end.getHours() + 2);

  return {
    id: `demo-pass-${format}`,
    eventId: `demo-event-${format}`,
    eventTitle:
      format === "online"
        ? "オンラインまちづくりワークショップ（デモ）"
        : "ハイブリッド地域マルシェ（デモ）",
    eventImage:
      "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80",
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    venueName: format === "online" ? "オンライン開催" : "市民ホール＋オンライン",
    venueAddress:
      format === "online" ? undefined : "東京都渋谷区〇〇町1-2-3",
    attendeeName: "デモ 太郎",
    receptionNumber: "MG-DEMO-001",
    paymentStatus: "free",
    receptionType: "qr",
    ticketLabel: "大人",
    quantity: 1,
    qrValue: "mg-pass:demo-online",
    expiresAt: end.toISOString(),
    status: "upcoming",
    kind: "visitor",
    eventFormat: format,
    organizerContact: "demo@example.com",
  };
}

function buildDemoAccess(
  format: EventFormat,
  phase: LinkPhase
): EventOnlineAccessResponse {
  const start = new Date();
  start.setHours(start.getHours() + 2, 0, 0, 0);
  const available = new Date(start);
  available.setMinutes(available.getMinutes() - 15);

  if (phase === "waiting") {
    return {
      eventFormat: format,
      linkVisible: false,
      waitingMessage: "オンライン参加リンクは、開始15分前に表示されます",
      joinAvailableAt: available.toISOString(),
      eventStartAt: start.toISOString(),
      onlineService: "zoom",
      onlineServiceLabel: "Zoom",
      onlineJoinUrl: null,
      onlineMeetingId: null,
      onlinePasscode: null,
      onlineGuideMessage: null,
      passIssued: true,
    };
  }

  return {
    eventFormat: format,
    linkVisible: true,
    waitingMessage: null,
    joinAvailableAt: available.toISOString(),
    eventStartAt: start.toISOString(),
    onlineService: "zoom",
    onlineServiceLabel: "Zoom",
    onlineJoinUrl: "https://zoom.us/j/1234567890",
    onlineMeetingId: "123 456 7890",
    onlinePasscode: "DEMO12",
    onlineGuideMessage:
      "開始10分前から入室できます。マイクはミュートでお入りください。",
    passIssued: true,
  };
}

/** オンライン参加パスの見た目確認用デモ（API・DB不要） */
export default function PassOnlineDemoPage() {
  const [format, setFormat] = useState<EventFormat>("online");
  const [phase, setPhase] = useState<LinkPhase>("visible");

  const pass = useMemo(() => buildDemoPass(format), [format]);
  const demoAccess = useMemo(
    () => buildDemoAccess(format, phase),
    [format, phase]
  );

  return (
    <div className="min-h-dvh bg-[var(--mg-paper,#faf9f6)]">
      <div className="mx-auto max-w-[1100px] px-4 py-4 min-[900px]:px-7 min-[900px]:py-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium text-[#6a7468]">デモ</p>
            <h1 className="text-[18px] font-semibold tracking-tight text-[#1a2818]">
              オンライン参加パス
            </h1>
            <p className="mt-0.5 text-[12.5px] text-[#5a665c]">
              実際のパスUIで、リンク表示前／表示後を切り替えられます
            </p>
          </div>
          <Link
            href="/pass"
            className="text-[12.5px] font-medium text-[#2B3A6B] underline-offset-2 hover:underline"
          >
            本物の参加パスへ
          </Link>
        </div>

        <div className="mb-4 flex flex-wrap gap-2 rounded-[12px] border border-[#e0e8e0] bg-white p-2.5">
          <div className="flex gap-1">
            {(
              [
                ["online", "オンライン"],
                ["hybrid", "ハイブリッド"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFormat(value)}
                className={[
                  "rounded-full px-3 py-1.5 text-[12px] font-semibold transition",
                  format === value
                    ? "bg-[#2B3A6B] text-white"
                    : "bg-[#f4f6f4] text-[#4a584c] hover:bg-[#eef2ee]",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mx-1 hidden h-7 w-px bg-[#e0e8e0] min-[520px]:block" />
          <div className="flex gap-1">
            {(
              [
                ["waiting", "リンク表示前"],
                ["visible", "リンク表示中"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPhase(value)}
                className={[
                  "rounded-full px-3 py-1.5 text-[12px] font-semibold transition",
                  phase === value
                    ? "bg-[#6BBF3E] text-white"
                    : "bg-[#f4f6f4] text-[#4a584c] hover:bg-[#eef2ee]",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 min-[900px]:grid-cols-2">
          <section className="min-w-0">
            <h2 className="mb-2 text-[12px] font-semibold text-[#6a7468]">
              PC詳細パネル
            </h2>
            <div className="rounded-[16px] border border-[#e0e8e0] bg-[#f7f9f7] p-3">
              <PassDetailPanel
                pass={pass}
                onClose={() => undefined}
                demoAccess={demoAccess}
              />
            </div>
          </section>

          <section className="min-w-0">
            <h2 className="mb-2 text-[12px] font-semibold text-[#6a7468]">
              モバイルチケット
            </h2>
            <div className="mx-auto max-w-[400px] rounded-[16px] border border-[#e0e8e0] bg-[#1a2818]/5 p-3">
              <PassMobileTicket
                pass={pass}
                onClose={() => undefined}
                demoAccess={demoAccess}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
