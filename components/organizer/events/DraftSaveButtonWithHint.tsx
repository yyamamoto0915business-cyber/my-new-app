"use client";

import { cn } from "@/lib/utils";

type DraftSaveButtonProps = {
  onClick: () => void;
  submitting: boolean;
  className?: string;
};

function SaveIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

export function DraftSaveHint({
  className = "",
  multiline = false,
  destinationLabel = "イベント管理",
}: {
  className?: string;
  /** PCサイドなど狭い幅向けに、意味の切れ目で改行する */
  multiline?: boolean;
  /** 「〇〇」から編集できる、のラベル */
  destinationLabel?: string;
}) {
  const highlight = (
    <span className="font-semibold text-[#3d7a5f]">「{destinationLabel}」</span>
  );
  return (
    <p
      className={cn(
        "rounded-[8px] border border-[#e0ddd6] bg-white px-3 py-1.5 text-center text-[11px] leading-[1.55] text-[#555]",
        className
      )}
    >
      {multiline ? (
        <>
          保存した下書きは
          <br />
          {highlight}
          から
          <br />
          いつでも編集できます。
        </>
      ) : (
        <>
          保存した下書きは {highlight}
          からいつでも編集できます。
        </>
      )}
    </p>
  );
}

export function DraftSaveButton({
  onClick,
  submitting,
  className = "",
}: DraftSaveButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={submitting}
      className={cn(
        "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-[#3d5348] bg-[#f7f8f6] px-3.5 text-[13px] font-medium text-[#2f453c] hover:bg-[#eef1ee] disabled:opacity-50",
        className
      )}
    >
      <SaveIcon size={14} />
      {submitting ? "保存中…" : "下書き保存"}
    </button>
  );
}
