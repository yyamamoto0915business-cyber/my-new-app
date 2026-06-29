"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Bookmark, Send, X } from "lucide-react";
import {
  EVENT_CONSULT_INTENTS,
  EVENT_CONSULT_MESSAGE_MAX,
  EVENT_CONSULT_MESSAGE_MAX_PC,
} from "@/lib/event-consult-intents";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  eventTitle?: string;
  organizerName?: string;
  initialIntentId?: string;
  sending: boolean;
  error: string | null;
  onClose: () => void;
  onSend: (message: string) => void;
};

function usePcViewport() {
  const [isPc, setIsPc] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    const update = () => setIsPc(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isPc;
}

function ConsultEnvelopeIllustration() {
  return (
    <div
      className="mg-consult-modal__icon-ring relative flex h-12 w-12 items-center justify-center rounded-full min-[900px]:h-[50px] min-[900px]:w-[50px]"
      aria-hidden
    >
      <svg viewBox="0 0 56 44" className="h-8 w-10 min-[900px]:h-[34px] min-[900px]:w-[42px]">
        <path
          d="M6 10h44a3 3 0 013 3v20a3 3 0 01-3 3H6a3 3 0 01-3-3V13a3 3 0 013-3z"
          fill="#FAF7F0"
          stroke="#3a8a3f"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path
          d="M6 14l22 14 22-14"
          fill="none"
          stroke="#3a8a3f"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <svg
        viewBox="0 0 14 13"
        className="absolute -right-0.5 top-1 h-3.5 w-3.5 min-[900px]:-right-1 min-[900px]:top-0.5"
      >
        <path
          d="M7 11.5 C7 11.5 1.5 7.5 1.5 4 C1.5 2.2 3 1 4.5 1 C5.6 1 6.5 1.6 7 2.8 C7.5 1.6 8.4 1 9.5 1 C11 1 12.5 2.2 12.5 4 C12.5 7.5 7 11.5 7 11.5Z"
          fill="none"
          stroke="#3a8a3f"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function ConsultModalHeader({
  organizerName,
  eventTitle,
}: {
  organizerName?: string;
  eventTitle?: string;
}) {
  return (
    <header className="mg-consult-modal__header-glow relative px-5 pb-4 pt-7 pr-10 min-[900px]:px-6 min-[900px]:pb-4 min-[900px]:pt-7 min-[900px]:pr-11">
      <div className="flex items-start gap-3 min-[900px]:gap-3.5">
        <ConsultEnvelopeIllustration />
        <div className="min-w-0 flex-1 pt-0.5">
          <h2
            id="event-consult-modal-title"
            className="mg-consult-modal__header-title text-[16px] font-semibold leading-[1.45] text-[#1a2818] min-[900px]:text-[17px]"
          >
            主催者にメッセージを送る
          </h2>
          <p className="mt-1.5 text-left text-[11.5px] leading-[1.75] text-[#939d93] min-[900px]:mt-2 min-[900px]:text-[12px] min-[900px]:leading-[1.8]">
            {organizerName ? (
              <span className="font-medium text-[#3d4a3b]">{organizerName}</span>
            ) : (
              "主催者"
            )}
            <span className="text-[#b5bdb5]"> さんに、</span>
            {eventTitle ? (
              <>
                <span className="text-[#b5bdb5]">「</span>
                <span className="font-medium text-[#2c3829]">{eventTitle}</span>
                <span className="text-[#b5bdb5]">」</span>
              </>
            ) : (
              "このイベント"
            )}
            <span className="text-[#b5bdb5]">について</span>
            メッセージを送ることができます。
          </p>
        </div>
      </div>
    </header>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center gap-2 min-[900px]:mb-3">
      <span className="h-1 w-1 shrink-0 rounded-full bg-[#C9A227]/80" aria-hidden />
      <p className="text-[11px] font-medium tracking-[0.04em] text-[#8a9e80] min-[900px]:text-[12px]">
        {children}
      </p>
    </div>
  );
}

export function EventOrganizerConsultModal({
  open,
  eventTitle,
  organizerName,
  initialIntentId = "question",
  sending,
  error,
  onClose,
  onSend,
}: Props) {
  const isPc = usePcViewport();
  const messageMax = isPc ? EVENT_CONSULT_MESSAGE_MAX_PC : EVENT_CONSULT_MESSAGE_MAX;

  const [intentId, setIntentId] = useState(initialIntentId);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    setIntentId(initialIntentId);
  }, [open, initialIntentId]);

  useEffect(() => {
    const selected = EVENT_CONSULT_INTENTS.find((i) => i.id === intentId);
    setMessage(selected?.template ?? "");
  }, [intentId, open]);

  useEffect(() => {
    setMessage((prev) => prev.slice(0, messageMax));
  }, [messageMax]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const draft = message.trim();
  const charCount = message.length;

  return (
    <div
      className="mg-event-detail mg-event-detail-pc mg-consult-modal fixed inset-0 z-[70] flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-consult-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#1c2419]/30 backdrop-blur-[5px] saturate-[1.05]"
        onClick={onClose}
        aria-label="閉じる"
      />
      <div
        className={cn(
          "mg-consult-modal__panel relative z-10 flex w-full max-w-[min(100%,352px)] flex-col overflow-hidden rounded-[26px]",
          "max-h-[min(88vh,620px)]",
          "min-[900px]:w-[432px] min-[900px]:max-w-[calc(100vw-2.5rem)] min-[900px]:max-h-[min(88vh,600px)] min-[900px]:rounded-[28px]"
        )}
        style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom, 0px))" }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 z-20 flex h-7 w-7 items-center justify-center rounded-full text-[#b8beb8] transition hover:bg-[#f2f4f0] hover:text-[#5a6b58]"
          aria-label="閉じる"
        >
          <X className="h-[15px] w-[15px] stroke-[2]" aria-hidden />
        </button>

        <div className="overflow-y-auto overscroll-contain">
          <ConsultModalHeader
            organizerName={organizerName}
            eventTitle={eventTitle}
          />

          <div className="px-5 pb-5 pt-4 min-[900px]:px-7 min-[900px]:pb-6 min-[900px]:pt-4">
            <div className="hidden min-[900px]:block">
              <SectionLabel>トピックを選ぶ（任意）</SectionLabel>
            </div>
            <div
              className="grid grid-cols-2 gap-1.5 min-[900px]:grid-cols-4 min-[900px]:gap-1.5"
              role="group"
              aria-label="用件を選ぶ"
            >
              {EVENT_CONSULT_INTENTS.map((opt) => {
                const selected = opt.id === intentId;
                const Icon = opt.icon;
                const longLabel = opt.label.length > 8;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setIntentId(opt.id)}
                    className={cn(
                      "mg-consult-modal__chip flex items-center justify-center gap-1 rounded-full border font-medium",
                      "min-h-[40px] px-2 py-1.5 text-[10.5px] leading-tight",
                      "min-[900px]:min-h-[52px] min-[900px]:flex-col min-[900px]:gap-1 min-[900px]:px-1.5 min-[900px]:py-2",
                      longLabel
                        ? "min-[900px]:text-[9px] min-[900px]:leading-[1.15]"
                        : "min-[900px]:text-[10px]",
                      selected
                        ? "mg-consult-modal__chip--selected border-transparent text-white"
                        : "border-[#ebebeb] bg-white text-[#6b7569] shadow-[0_1px_2px_rgba(26,40,24,0.04)] hover:border-[#dce8d6] hover:bg-[#f8fbf7]"
                    )}
                  >
                    <Icon
                      className={cn(
                        "shrink-0",
                        "h-3 w-3 min-[900px]:h-3.5 min-[900px]:w-3.5",
                        selected ? "text-white/90" : "text-[#9aaa96]"
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0 text-center leading-none">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 min-[900px]:mt-5">
              <div className="hidden min-[900px]:block">
                <SectionLabel>メッセージを入力</SectionLabel>
              </div>
              <div className="relative">
                <textarea
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value.slice(0, messageMax));
                  }}
                  placeholder="メッセージを入力"
                  rows={3}
                  maxLength={messageMax}
                  className={cn(
                    "mg-consult-modal__textarea w-full resize-none rounded-[18px] border border-[#ebebeb] bg-white",
                    "px-4 py-3 pb-8 text-[14px] leading-[1.75] text-[#1a2818]",
                    "placeholder:text-[#c5ccc5]",
                    "transition-[border-color,box-shadow] duration-200",
                    "focus:outline-none",
                    "min-[900px]:min-h-[92px] min-[900px]:text-[13.5px]"
                  )}
                />
                <span className="pointer-events-none absolute bottom-2.5 right-3.5 text-[10px] tabular-nums text-[#c5ccc5]">
                  {charCount}/{messageMax}
                </span>
              </div>
            </div>

            {error ? (
              <p className="mt-2.5 text-center text-xs text-red-600" role="alert">
                {error}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col items-center gap-3 min-[900px]:mt-5">
              <button
                type="button"
                onClick={() => onSend(draft)}
                disabled={sending || !draft}
                className="mg-consult-modal__send flex h-[46px] w-full items-center justify-center gap-2 rounded-full text-[13.5px] font-semibold tracking-wide text-white disabled:opacity-50 min-[900px]:h-[44px] min-[900px]:text-[13px]"
              >
                <Send className="h-[15px] w-[15px] opacity-90" aria-hidden />
                {sending ? "送信中..." : "送信して会話を始める"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={sending}
                className={cn(
                  "text-[13px] font-medium text-[#9aaa96] underline-offset-[3px] transition",
                  "hover:text-[#526448] hover:underline disabled:opacity-50",
                  "min-[900px]:text-[12.5px]"
                )}
              >
                <span className="inline-flex items-center gap-1.5 min-[900px]:inline">
                  <Bookmark className="h-3.5 w-3.5 min-[900px]:hidden" aria-hidden />
                  あとで
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
