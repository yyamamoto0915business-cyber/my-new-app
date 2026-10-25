"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  reportId: string;
  /** ユーザーへの通報は非表示にできないので「対応済み」だけ */
  canHide: boolean;
};

export function AdminReportActions({ reportId, canHide }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "hide" | "dismiss") {
    if (busy) return;
    if (action === "hide" && !window.confirm("この内容を非表示にしますか？")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: { message?: string };
      } | null;
      if (!res.ok || !json?.ok) {
        setError(json?.error?.message ?? "更新に失敗しました");
        return;
      }
      router.refresh();
    } catch {
      setError("更新に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        {canHide ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void run("hide")}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            非表示にする
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={() => void run("dismiss")}
          className="rounded-lg border border-[#c8dcd0] bg-white px-3 py-1.5 text-xs font-medium text-[#1e3848] disabled:opacity-50"
        >
          {canHide ? "問題なし" : "対応済み"}
        </button>
      </div>
      {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
    </div>
  );
}
