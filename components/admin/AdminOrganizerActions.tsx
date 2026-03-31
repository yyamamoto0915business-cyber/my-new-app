"use client";

import { useState } from "react";

type Action = "30d" | "90d" | "forever" | "cancel" | "free";

export function AdminOrganizerActions({
  organizerId,
  currentReason,
}: {
  organizerId: string;
  currentReason: string;
}) {
  const [reason, setReason] = useState(currentReason);
  const [submitting, setSubmitting] = useState<null | string>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAction = async (action: Action) => {
    const label =
      action === "30d"
        ? "30 日付与"
        : action === "90d"
        ? "90 日付与"
        : action === "forever"
        ? "無期限付与"
        : action === "cancel"
        ? "手動付与の取り消し"
        : "無料プランへ戻す";

    const confirmText =
      action === "cancel" || action === "free"
        ? `本当にこの主催者の ${label} を実行しますか？`
        : `この主催者に ${label} を実行します。よろしいですか？`;

    if (!window.confirm(confirmText)) return;

    setSubmitting(action);
    setMessage(null);
    setError(null);
    try {
      const isRevoke = action === "cancel" || action === "free";
      const url = isRevoke
        ? `/api/admin/organizers/${organizerId}/revoke`
        : `/api/admin/organizers/${organizerId}/grant`;
      const body = isRevoke
        ? { reason }
        : {
            grantType:
              action === "30d" ? "30_days" : action === "90d" ? "90_days" : "unlimited",
            reason,
          };
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          (json as { error?: { message?: string } })?.error?.message ??
          (typeof json === "string" ? json : "更新に失敗しました。");
        throw new Error(msg);
      }
      const toastMsg =
        (json as { data?: { toast?: string } })?.data?.toast ??
        `「${label}」を実行しました。最新状態は画面を再読み込みして確認してください。`;
      setMessage(toastMsg);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "更新に失敗しました。");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="space-y-4 text-sm">
      <p className="text-xs text-slate-500">
        実行前に必ず内容を確認してください。操作後はすぐに反映され、Stripe
        の状態よりも手動付与が優先されます。
      </p>

      <label className="block text-xs text-slate-500">
        理由メモ（監査ログに保存）
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          rows={3}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => runAction("30d")}
          disabled={!!submitting}
          className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          30日付与
        </button>
        <button
          type="button"
          onClick={() => runAction("90d")}
          disabled={!!submitting}
          className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          90日付与
        </button>
        <button
          type="button"
          onClick={() => runAction("forever")}
          disabled={!!submitting}
          className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          無期限付与
        </button>
        <button
          type="button"
          onClick={() => runAction("cancel")}
          disabled={!!submitting}
          className="rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          手動付与取消
        </button>
        <button
          type="button"
          onClick={() => runAction("free")}
          disabled={!!submitting}
          className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-60"
        >
          無料プランへ戻す
        </button>
      </div>

      {message && (
        <div className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
