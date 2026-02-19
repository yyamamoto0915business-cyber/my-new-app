"use client";

import { useState, useEffect } from "react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/language-provider";

const TYPE_LABELS: Record<string, string> = {
  volunteer: "ボランティア",
  paid_spot: "謝礼あり",
  job: "求人",
  tech_volunteer: "技術ボラ",
};

type Recruitment = {
  id: string;
  type: string;
  title: string;
  description: string;
  events?: { title: string; date: string } | null;
  organizers?: { organization_name: string } | null;
};

function RecruitmentCard({ r }: { r: Recruitment }) {
  const { t } = useLanguage();
  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200/60 bg-white shadow-lg dark:border-zinc-700/60 dark:bg-zinc-900">
      <Link href={`/recruitments/${r.id}`} className="block p-4">
        <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
          {TYPE_LABELS[r.type] ?? r.type}
        </span>
        <h2 className="mt-2 line-clamp-2 font-semibold text-zinc-900 dark:text-zinc-100">
          {r.title}
        </h2>
        <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
          {r.description}
        </p>
        {r.events && (
          <p className="mt-2 text-xs text-zinc-500">
            {r.events.title} {r.events.date}
          </p>
        )}
        <span className="mt-3 inline-flex rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90">
          {t.viewDetails}
        </span>
      </Link>
    </article>
  );
}

export function HomeRecruitmentCards() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [recruitments, setRecruitments] = useState<Recruitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prefecture = searchParams.get("prefecture") ?? "";

  const load = () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (prefecture) params.set("prefecture", prefecture);
    const qs = params.toString();
    fetchWithTimeout(`/api/recruitments${qs ? `?${qs}` : ""}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setRecruitments(Array.isArray(data) ? data.slice(0, 4) : []))
      .catch(() => {
        setRecruitments([]);
        setError("読み込みに失敗しました");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [prefecture]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-white/80 p-6 text-center dark:bg-zinc-900/80">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={load}
          className="mt-2 text-sm text-[var(--accent)] underline"
        >
          再読み込み
        </button>
      </div>
    );
  }

  if (recruitments.length === 0) {
    return (
      <p className="rounded-2xl bg-white/80 p-6 text-center text-sm text-zinc-500 dark:bg-zinc-900/80">
        {t.noRecruitments}
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {recruitments.map((r) => (
        <li key={r.id}>
          <RecruitmentCard r={r} />
        </li>
      ))}
    </ul>
  );
}
