"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { VOLUNTEER_ROLE_LABELS } from "@/lib/volunteer-roles-mock";

type VolunteerRoleWithEvent = {
  id: string;
  eventId: string;
  roleType: string;
  title: string;
  description: string;
  dateTime: string;
  location: string;
  capacity: number;
  perksText?: string;
  hasTransportSupport: boolean;
  hasHonorarium: boolean;
  event?: { id: string; title: string; date: string; prefecture?: string } | null;
};

function VolunteerPageContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const prefecture = searchParams.get("prefecture") ?? "";
  const roleType = searchParams.get("roleType") ?? "";
  const [roles, setRoles] = useState<VolunteerRoleWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (prefecture) params.set("prefecture", prefecture);
    if (roleType) params.set("roleType", roleType);
    fetchWithTimeout(`/api/volunteer/roles?${params}`)
      .then((r) => r.json())
      .then((data) => setRoles(Array.isArray(data) ? data : []))
      .catch(() => {
        setRoles([]);
        setError("読み込みに失敗しました");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [prefecture, roleType]);

  const handleApply = async (volunteerRoleId: string) => {
    if (!session?.user) {
      window.location.href = `/login?returnTo=${encodeURIComponent("/volunteer")}`;
      return;
    }
    setApplying(volunteerRoleId);
    try {
      const res = await fetchWithTimeout("/api/volunteer/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volunteerRoleId }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "応募に失敗しました");
      }
    } catch {
      setError("通信に失敗しました");
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-zinc-200/60 bg-white/80 shadow-sm backdrop-blur-md dark:border-zinc-700/60 dark:bg-zinc-900/80">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Breadcrumb
            items={[{ label: "トップ", href: "/" }, { label: "ボランティア募集" }]}
          />
          <h1 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            ボランティア募集
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6 space-y-4 rounded-xl border border-zinc-200/60 bg-white/80 p-4 dark:border-zinc-700/60 dark:bg-zinc-900/80">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            地域で絞り込みは上部のフィルターをご利用ください
          </p>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-xs text-zinc-500">種別</label>
              <select
                value={roleType}
                onChange={(e) => {
                  const p = new URLSearchParams(searchParams.toString());
                  if (e.target.value) p.set("roleType", e.target.value);
                  else p.delete("roleType");
                  window.location.search = p.toString();
                }}
                className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
              >
                <option value="">すべて</option>
                {Object.entries(VOLUNTEER_ROLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-zinc-500">読み込み中...</p>
        ) : error ? (
          <div>
            <p className="text-red-600">{error}</p>
            <button
              type="button"
              onClick={load}
              className="mt-2 text-sm text-[var(--accent)] underline"
            >
              再読み込み
            </button>
          </div>
        ) : roles.length === 0 ? (
          <p className="rounded-xl border border-zinc-200/60 bg-white/80 p-8 text-center text-zinc-500 dark:border-zinc-700/60 dark:bg-zinc-900/80">
            該当する募集はありません
          </p>
        ) : (
          <ul className="space-y-4">
            {roles.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-zinc-200/60 bg-white/80 p-4 shadow-sm dark:border-zinc-700/60 dark:bg-zinc-900/80"
              >
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                  {VOLUNTEER_ROLE_LABELS[r.roleType as keyof typeof VOLUNTEER_ROLE_LABELS] ?? r.roleType}
                </span>
                <h2 className="mt-2 font-semibold text-zinc-900 dark:text-zinc-100">
                  {r.title}
                </h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {r.description}
                </p>
                {r.event && (
                  <p className="mt-2 text-sm text-zinc-500">
                    {r.event.title}（{r.event.date}）
                    {r.event.prefecture && ` · ${r.event.prefecture}`}
                  </p>
                )}
                <p className="mt-1 text-sm">
                  {r.dateTime} / {r.location} / 定員{r.capacity}名
                </p>
                {(r.hasTransportSupport || r.hasHonorarium || r.perksText) && (
                  <p className="mt-1 text-sm text-zinc-500">
                    {[r.hasTransportSupport && "交通費支給", r.hasHonorarium && "謝礼あり", r.perksText]
                      .filter(Boolean)
                      .join("、")}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => handleApply(r.id)}
                  disabled={!!applying}
                  className="mt-3 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {applying === r.id ? "処理中..." : "応募して相談する"}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8">
          <Link
            href="/recruitments"
            className="text-sm text-zinc-500 underline hover:text-zinc-700"
          >
            募集一覧（旧） →
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function VolunteerPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-zinc-500">読み込み中...</div>}>
      <VolunteerPageContent />
    </Suspense>
  );
}
