"use client";

import { useEffect } from "react";
import { CalendarDays, MapPin, Ticket, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type EventApplyConfirmInfo = {
  title: string;
  dateLabel?: string | null;
  placeLabel?: string | null;
  priceLabel?: string | null;
};

type Props = {
  open: boolean;
  event: EventApplyConfirmInfo;
  confirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <div
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef5ea] text-[#3f7a42]"
        aria-hidden
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[10.5px] font-medium tracking-[0.06em] text-[#8a9a82]">
          {label}
        </p>
        <p className="mt-0.5 text-[13px] leading-snug text-[#3d4a3b]">{value}</p>
      </div>
    </div>
  );
}

/**
 * 申込前の確認カード（画面中央に浮かせて表示）。
 */
export function EventApplyConfirmSheet({
  open,
  event,
  confirming = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !confirming) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, confirming, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] min-[900px]:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-apply-confirm-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#1a2818]/32"
        aria-label="閉じる"
        disabled={confirming}
        onClick={onCancel}
      />

      <div
        className={cn(
          "mg-apply-confirm-sheet relative z-10 w-full max-w-[400px] overflow-hidden",
          "rounded-[22px] border border-white/70",
          "bg-[linear-gradient(165deg,#ffffff_0%,#faf9f5_48%,#f5f3ed_100%)]",
          "shadow-[0_8px_16px_rgba(26,40,24,0.06),0_24px_48px_rgba(26,40,24,0.14),0_40px_80px_rgba(26,40,24,0.1)]",
          "ring-1 ring-[#1a2818]/6"
        )}
      >
        <div
          className="pointer-events-none absolute -left-10 -top-12 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(108,168,98,0.22)_0%,transparent_70%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-8 top-16 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(201,180,90,0.14)_0%,transparent_70%)]"
          aria-hidden
        />

        <div className="relative px-5 pb-1 pt-5 min-[900px]:px-6 min-[900px]:pt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={confirming}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-[#7a8a72] shadow-sm transition hover:bg-white hover:text-[#1a2818] disabled:opacity-50 min-[900px]:right-4 min-[900px]:top-4"
            aria-label="閉じる"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>

          <div className="pr-8">
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#d7e6d2]/90 bg-white text-[#348b38] shadow-[0_8px_20px_rgba(52,139,56,0.14)]"
                aria-hidden
              >
                <Ticket className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <p className="text-[11px] font-semibold tracking-[0.08em] text-[#6f8f5a]">
                申し込みの確認
              </p>
            </div>
            <h2
              id="event-apply-confirm-title"
              className="mt-3 whitespace-nowrap text-[17px] font-semibold leading-[1.35] tracking-[-0.01em] text-[#1a2818] min-[900px]:text-[18px]"
            >
              このイベントに申し込みますか？
            </h2>
          </div>

          <p className="mt-3.5 text-[12.5px] leading-[1.75] text-[#65725e]">
            申し込むと参加パスが発行されます。当日の受付やオンライン参加に使えます。
          </p>
        </div>

        <div className="relative mx-5 mt-4 mb-5 overflow-hidden rounded-2xl border border-[#e4ecd9] bg-white/95 shadow-[0_10px_28px_rgba(26,40,24,0.06)] min-[900px]:mx-6">
          <div
            className="h-[3px] w-full bg-[linear-gradient(90deg,#7cb56e_0%,#348b38_55%,#cfe6c8_100%)]"
            aria-hidden
          />
          <div className="px-4 py-4">
            <p className="line-clamp-3 text-[14.5px] font-semibold leading-snug text-[#1a2818]">
              {event.title}
            </p>
            <div className="mt-3.5 space-y-3 border-t border-dashed border-[#e6edd9] pt-3.5">
              {event.dateLabel ? (
                <MetaRow
                  icon={CalendarDays}
                  label="日時"
                  value={event.dateLabel}
                />
              ) : null}
              {event.placeLabel ? (
                <MetaRow icon={MapPin} label="場所" value={event.placeLabel} />
              ) : null}
              {event.priceLabel ? (
                <MetaRow icon={Ticket} label="参加費" value={event.priceLabel} />
              ) : null}
            </div>
          </div>
        </div>

        <div className="relative flex flex-col gap-1.5 px-5 pb-5 min-[900px]:px-6 min-[900px]:pb-6">
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="flex min-h-[50px] w-full items-center justify-center rounded-2xl bg-[#348b38] px-4 text-[15px] font-bold tracking-wide text-white shadow-[0_12px_28px_rgba(52,139,56,0.32)] transition hover:bg-[#2d7a32] hover:shadow-[0_14px_32px_rgba(52,139,56,0.36)] active:scale-[0.99] disabled:opacity-60"
          >
            {confirming ? "申し込み中..." : "申し込む"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={confirming}
            className="flex min-h-[42px] w-full items-center justify-center rounded-2xl px-4 text-[13.5px] font-medium text-[#6a7a64] transition hover:bg-[rgba(26,40,24,0.04)] hover:text-[#1a2818] disabled:opacity-60"
          >
            やめる
          </button>
        </div>
      </div>
    </div>
  );
}
