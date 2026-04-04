"use client";

import { useState } from "react";
import { ShareButton } from "@/components/share-button";
import { EventChatButton } from "./event-chat-button";

type Props = {
  eventId: string;
  eventTitle: string;
  organizerId?: string | null;
  /** 主催者の auth / profiles.id（API でイベント主催者と突合） */
  organizerUserId?: string | null;
  organizerName?: string | null;
};

const CHIP_TEXTS = ["持ち物", "集合場所", "参加相談", "雨天時", "ボランティア"] as const;

export function EventConsultationCard({
  eventId,
  eventTitle,
  organizerId,
  organizerUserId,
  organizerName,
}: Props) {
  const [openSignal, setOpenSignal] = useState(0);
  const [openIntentId, setOpenIntentId] = useState<string | undefined>(undefined);

  return (
    <section className="rounded-[24px] border border-slate-200/90 bg-white/95 p-4 shadow-[0_4px_14px_rgba(15,23,42,0.05)] sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[16px] font-semibold text-slate-900 sm:text-lg">
            主催者に相談できます
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            分からないことや参加前の相談があれば、主催者へ直接メッセージできます。
          </p>
        </div>
        <div className="shrink-0">
          <ShareButton
            url={`/events/${eventId}`}
            title={`${eventTitle} - MachiGlyph`}
            variant="compact"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {CHIP_TEXTS.map((t) => {
          const intentId =
            t === "持ち物"
              ? "bring"
              : t === "集合場所"
                ? "meeting"
                : t === "参加相談"
                  ? "consult"
                  : t === "雨天時"
                    ? "weather"
                    : "volunteer";

          return (
            <button
              key={t}
              type="button"
              onClick={() => {
                setOpenIntentId(intentId);
                setOpenSignal((s) => s + 1);
              }}
              className="h-10 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition-colors active:bg-slate-50"
            >
              {t}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <EventChatButton
          eventId={eventId}
          eventTitle={eventTitle}
          organizerId={organizerId ?? undefined}
          organizerUserId={organizerUserId ?? undefined}
          organizerName={organizerName ?? undefined}
          ctaLabel="主催者にメッセージを送る"
          ctaHelper="送信後はチャット形式でやり取りできます"
          openSignal={openSignal}
          openIntentId={openIntentId}
        />
      </div>
    </section>
  );
}

