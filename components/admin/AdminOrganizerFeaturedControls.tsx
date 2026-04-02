"use client";

import { useMemo, useState } from "react";

export function AdminOrganizerFeaturedControls({
  organizerId,
  initialIsFeatured,
  initialFeaturedRank,
}: {
  organizerId: string;
  initialIsFeatured: boolean;
  initialFeaturedRank: number | null;
}) {
  const [isFeatured, setIsFeatured] = useState(initialIsFeatured);
  const [rank, setRank] = useState<string>(
    initialFeaturedRank != null ? String(initialFeaturedRank) : ""
  );
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parsedRank = useMemo(() => {
    const v = rank.trim();
    if (!v) return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    const i = Math.floor(n);
    if (i < 1 || i > 9999) return null;
    return i;
  }, [rank]);

  const submit = async () => {
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/organizers/${organizerId}/featured`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          isFeatured,
          featuredRank: isFeatured ? parsedRank : null,
          reason,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          (json as { error?: { message?: string } })?.error?.message ??
          "更新に失敗しました。";
        throw new Error(msg);
      }
      const toastMsg =
        (json as { data?: { toast?: string } })?.data?.toast ??
        "更新しました。最新状態は画面を再読み込みして確認してください。";
      setMessage(toastMsg);
    } catch (e) {
      setError(e instanceof Error ? e.message : "更新に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">注目の主催者</div>
          <div className="mt-0.5 text-xs text-slate-500">
            ONにするとトップの「注目の主催者」に優先表示されます（rankが小さいほど上位）。
          </div>
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          注目にする
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <div className="text-xs text-slate-500">表示順位（任意）</div>
          <input
            type="number"
            min={1}
            max={9999}
            value={rank}
            onChange={(e) => setRank(e.target.value)}
            disabled={!isFeatured || submitting}
            placeholder="例: 1"
            className="mt-1 w-full rounded-md border border-slate-300 bg-slate-50 px-2 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:opacity-60"
          />
          {isFeatured && rank.trim() !== "" && parsedRank == null && (
            <div className="mt-1 text-xs text-red-600">1〜9999の整数で入力してください</div>
          )}
        </label>

        <label className="block">
          <div className="text-xs text-slate-500">理由メモ（ログ保存）</div>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={submitting}
            placeholder="例: 4月の特集枠"
            className="mt-1 w-full rounded-md border border-slate-300 bg-slate-50 px-2 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:opacity-60"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={submitting || (isFeatured && rank.trim() !== "" && parsedRank == null)}
        className="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {submitting ? "更新中..." : "更新する"}
      </button>

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

