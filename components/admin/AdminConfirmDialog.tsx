"use client";

import type { ReactNode } from "react";

export function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "実行する",
  cancelLabel = "キャンセル",
  danger = false,
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/30 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-confirm-title"
    >
      <div className="w-full max-w-md rounded-xl border border-[#c8dcd0] bg-white p-5 shadow-lg">
        <h2
          id="admin-confirm-title"
          className="text-base font-semibold text-[#0e1610]"
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-[#5a7868]">
            {description}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-lg border border-[#c8dcd0] px-3.5 py-2 text-sm text-[#3a5848] hover:bg-[#eaf2ec] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium text-white disabled:opacity-50 ${
              danger
                ? "bg-[#C81E1E] hover:bg-[#a31818]"
                : "bg-[#1e3848] hover:bg-[#152836]"
            }`}
          >
            {pending ? "処理中…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminConfirmDialogSlot({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
