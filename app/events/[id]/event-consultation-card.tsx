"use client";

import { useState } from "react";
import { ShareButton } from "@/components/share-button";
import { EventChatButton } from "./event-chat-button";

type Props = {
  eventId: string;
  eventTitle: string;
  organizerName?: string | null;
};

const CHIP_TEXTS = ["持ち物", "集合場所", "参加相談", "雨天時", "ボランティア"] as const;

export function EventConsultationCard({ eventId, eventTitle, organizerName }: Props) {
  const [openSignal, setOpenSignal] = useState(0);
  const [openIntentId, setOpenIntentId] = useState<string | undefined>(undefined);

  return (
    <section className="rounded-xl border border-emerald-200 bg-white p-5 shadow-sm dark:border-emerald-800/50 dark:bg-zinc-900/50">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 sm:text-lg">主催者に相談できます</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
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
              className="min-h-[32px] rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-200 dark:hover:bg-emerald-900/20"
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

