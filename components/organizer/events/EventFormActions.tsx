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
  const publishLabel =
    publishDisabledReason === "required_missing"
      ? "必須項目を入力してください"
      : publishDisabledReason === "no_slots"
        ? "公開枠がありません"
        : "公開する";

  const isSubmitting = submitting !== null;
  const publishDisabled =
    isSubmitting || !canSubmit || publishDisabledReason !== null;

  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center ${
        compact ? "sm:justify-end" : ""
      }`}
    >
      <Link
        href="/organizer/events"
        className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200/80 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        キャンセル
      </Link>
      <button
        type="submit"
        form="event-form"
        disabled={isSubmitting || !canSubmit}
        className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200/80 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
      >
        {submitting === "draft" ? "下書き保存中..." : "下書き保存"}
      </button>
      <button
        type="button"
        onClick={onClickPublish}
        disabled={publishDisabled}
        className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[var(--mg-accent,theme(colors.amber.600))] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
      >
        {submitting === "publish" ? "公開中..." : publishLabel}
      </button>
      {publishDisabledReason === "no_slots" && (
        <Link
          href="/organizer/settings/plan"
          className="text-center text-xs font-medium text-amber-700 hover:underline sm:order-last sm:basis-full sm:text-left"
        >
          公開枠を増やす → プラン変更
        </Link>
      )}
    </div>
  );
}
