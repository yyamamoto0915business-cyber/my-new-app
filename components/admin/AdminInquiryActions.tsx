"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CONTACT_STATUSES,
  type ContactStatus,
} from "@/lib/contact";

type Props = {
  inquiryId: string;
  initialStatus: ContactStatus;
  initialAdminNote: string;
};

export function AdminInquiryActions({
  inquiryId,
  initialStatus,
  initialAdminNote,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<ContactStatus>(initialStatus);
  const [adminNote, setAdminNote] = useState(initialAdminNote);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch(`/api/admin/inquiries/${inquiryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote }),
      });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: { message?: string };
      } | null;

      if (!res.ok || !json?.ok) {
        setError(json?.error?.message ?? "更新に失敗しました");
        return;
      }

      setMessage("保存しました");
      router.refresh();
    } catch {
      setError("更新に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-slate-900">対応状況</h3>
      <div className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="inquiry-status"
            className="mb-1.5 block text-xs font-medium text-slate-600"
          >
            ステータス
          </label>
          <select
            id="inquiry-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ContactStatus)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400 focus:bg-white"
          >
            {CONTACT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="inquiry-admin-note"
            className="mb-1.5 block text-xs font-medium text-slate-600"
          >
            管理者メモ
          </label>
          <textarea
            id="inquiry-admin-note"
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            rows={4}
            placeholder="対応メモを残せます"
            className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-[1.6] text-slate-800 outline-none focus:border-slate-400 focus:bg-white"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-rose-700">
            {error}
          </p>
        )}
        {message && (
          <p className="text-sm text-emerald-700">{message}</p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "保存中…" : "保存する"}
        </button>
      </div>
    </section>
  );
}
