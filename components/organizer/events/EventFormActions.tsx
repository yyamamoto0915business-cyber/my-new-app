"use client";

import Link from "next/link";

type EventFormActionsProps = {
  submitting: null | "draft" | "publish";
  canSubmit: boolean;
  publishDisabledReason: null | "required_missing" | "no_slots";
  onClickPublish: () => void;
  compact?: boolean;
};

export function EventFormActions({
  submitting,
  canSubmit,
  publishDisabledReason,
  onClickPublish,
  compact = false,
}: EventFormActionsProps) {
  const isSubmitting = submitting !== null;
  const publishDisabled =
    isSubmitting || !canSubmit || publishDisabledReason !== null;

  const baseAction =
    "inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm transition whitespace-nowrap leading-none md:min-w-[132px]";

  const publishStyle = (() => {
    if (isSubmitting) {
      return "bg-[var(--mg-accent,theme(colors.amber.600))] text-white opacity-70 cursor-wait";
    }
    if (publishDisabled) {
      return "border border-slate-200/80 bg-slate-200/70 text-slate-500 cursor-not-allowed";
    }
    return "bg-[var(--mg-accent,theme(colors.amber.600))] text-white hover:opacity-90";
  })();

  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center ${
        compact ? "sm:justify-end" : ""
      }`}
    >
      <Link
        href="/organizer/events"
        className={`${baseAction} border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50`}
      >
        キャンセル
      </Link>
      <button
        type="submit"
        form="event-form"
        disabled={isSubmitting || !canSubmit}
        className={`${baseAction} border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50`}
      >
        {submitting === "draft" ? "下書き保存中..." : "下書き保存"}
      </button>
      <button
        type="button"
        onClick={onClickPublish}
        disabled={publishDisabled}
        className={`${baseAction} ${publishStyle}`}
      >
        {submitting === "publish" ? "公開中..." : "公開する"}
      </button>
      {publishDisabledReason === "no_slots" && (
        <p className="text-center text-xs font-medium text-amber-700 sm:basis-full sm:text-right whitespace-nowrap">
          公開枠不足のため公開できません
        </p>
      )}
    </div>
  );
}
