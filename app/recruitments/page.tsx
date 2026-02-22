"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import Link from "next/link";
import { useSearchParamsNoSuspend } from "@/lib/use-search-params-no-suspend";
import { Breadcrumb } from "@/components/breadcrumb";

type Recruitment = {
  id: string;
  type: string;
  title: string;
  description: string;
  role?: string;
  tech_role?: string;
  pay_amount?: number;
  pay_type?: string;
  tech_slot?: string;
  events?: { title: string; date: string } | null;
  organizers?: { organization_name: string } | null;
};

const TYPE_LABELS: Record<string, string> = {
  volunteer: "ボランティア",
  paid_spot: "謝礼あり",
  job: "求人",
  tech_volunteer: "技術ボランティア",
};

const TECH_ROLE_LABELS: Record<string, string> = {
  photo: "撮影",
  streaming: "配信",
  translation: "翻訳",
  web: "Web運用",
  reception: "受付",
};

function RecruitmentsPageContent() {
  const searchParams = useSearchParamsNoSuspend();
  const prefecture = searchParams.get("prefecture") ?? "";
  const tagsParam = searchParams.get("tags") ?? "";
  const selectedTags = useMemo(
    () => (tagsParam ? tagsParam.split(",").filter(Boolean) : []),
    [tagsParam]
  );
  const tagsStr = selectedTags.join(",");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") ?? "");
  const [techRoleFilter, setTechRoleFilter] = useState(searchParams.get("tech_role") ?? "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("date_from") ?? "");
  const [dateTo, setDateTo] = useState(searchParams.get("date_to") ?? "");
  const [recruitments, setRecruitments] = useState<Recruitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (prefecture) params.set("prefecture", prefecture);
    if (tagsStr) params.set("tags", tagsStr);
    if (typeFilter) params.set("type", typeFilter);
    if (techRoleFilter) params.set("tech_role", techRoleFilter);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    const qs = params.toString();
    fetchWithTimeout(`/api/recruitments${qs ? `?${qs}` : ""}`)
      .then((r) => r.json())
      .then((data) => setRecruitments(Array.isArray(data) ? data : []))
      .catch(() => {
        setRecruitments([]);
        setError("読み込みに失敗しました");
      })
      .finally(() => setLoading(false));
  }, [prefecture, tagsStr, typeFilter, techRoleFilter, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Breadcrumb items={[{ label: "トップ", href: "/?mode=select" }, { label: "募集一覧" }]} />
          <h1 className="mt-2 text-2xl font-bold">募集一覧</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6 space-y-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            地域で絞り込みは上部のフィルターをご利用ください
          </p>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-xs text-zinc-500">種別</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="mt-1 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              >
                <option value="">すべて</option>
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            {typeFilter === "tech_volunteer" && (
              <div>
                <label className="block text-xs text-zinc-500">技術種別</label>
                <select
                  value={techRoleFilter}
                  onChange={(e) => setTechRoleFilter(e.target.value)}
                  className="mt-1 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <option value="">すべて</option>
                  {Object.entries(TECH_ROLE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs text-zinc-500">開始日</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500">終了日</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
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
        ) : (
          <ul className="space-y-4">
            {recruitments.length === 0 ? (
              <li className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
                募集はありません
              </li>
            ) : (
              recruitments.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/recruitments/${r.id}`}
                    className="block rounded-lg border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <span className="rounded bg-zinc-200 px-2 py-0.5 text-xs dark:bg-zinc-700">
                      {TYPE_LABELS[r.type] ?? r.type}
                    </span>
                    {r.tech_role && (
                      <span className="ml-1 rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {TECH_ROLE_LABELS[r.tech_role] ?? r.tech_role}
                      </span>
                    )}
                    <h2 className="mt-2 font-semibold">{r.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{r.description}</p>
                    <p className="mt-2 text-sm text-zinc-500">
                      {typeof r.events === "object" && r.events?.title
                        ? `${r.events.title}`
                        : null}
                      {typeof r.organizers === "object" && r.organizers?.organization_name
                        ? ` · ${r.organizers.organization_name}`
                        : ""}
                    </p>
                    {r.pay_amount && (
                      <p className="mt-1 text-sm font-medium">
                        {r.pay_type} ¥{r.pay_amount}
                      </p>
                    )}
                  </Link>
                </li>
              ))
            )}
          </ul>
        )}

        <div className="mt-8">
          <Link href="/organizer/recruitments" className="text-sm text-zinc-500 underline hover:text-zinc-700">
            主催者向け：募集管理 →
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function RecruitmentsPage() {
  return <RecruitmentsPageContent />;
}
