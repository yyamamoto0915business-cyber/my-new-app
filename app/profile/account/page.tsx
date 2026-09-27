"use client";

import { useState } from "react";
import Link from "next/link";

export default function ProfileAccountPage() {
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirmed || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/me/account", { method: "DELETE" });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "アカウントを削除できませんでした。時間をおいて再度お試しください。");
        setLoading(false);
        return;
      }
      window.location.assign("/");
    } catch {
      setError("通信が途中で切れました。時間をおいて再度お試しください。");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <Link
        href="/profile"
        className="mb-6 inline-block text-sm text-[#3d5c48] underline-offset-4 hover:underline"
      >
        ← マイページへ
      </Link>
      <h1 className="text-2xl font-bold text-[#1e3828]">アカウント</h1>
      <p className="mt-2 text-sm leading-relaxed text-[#5a7464]">
        アカウントを削除すると、ログイン情報とプロフィールが消えます。この操作は取り消せません。
      </p>
      <div className="mt-8 rounded-2xl border border-[#e4ebe6] bg-white p-6">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-[#c8dcd0]"
          />
          <span className="text-sm leading-relaxed text-[#1e3828]">
            削除すると元に戻せないことを確認しました
          </span>
        </label>
        {error ? <p className="mt-4 text-sm leading-relaxed text-red-600">{error}</p> : null}
        <button
          type="button"
          onClick={handleDelete}
          disabled={!confirmed || loading}
          className="mt-5 h-11 w-full rounded-full bg-[#8f2d2d] text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "削除しています..." : "アカウントを削除する"}
        </button>
      </div>
    </div>
  );
}
