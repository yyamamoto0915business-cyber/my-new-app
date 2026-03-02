"use client";

import Link from "next/link";

type Recruitment = {
  id: string;
  title: string;
  description: string;
  meeting_place: string | null;
  organizers?: { organization_name: string | null };
};

type Props = {
  recruitments: Recruitment[];
  loading?: boolean;
};

const SUPPORT_CARDS = [
  { title: "設営 1h", sub: "初心者OK", href: "/recruitments" },
  { title: "受付 30分", sub: "短時間", href: "/recruitments" },
  { title: "写真係", sub: "スマホでOK", href: "/recruitments" },
];

export function RecruitmentOrMissions({ recruitments, loading }: Props) {
  const isEmpty = !loading && recruitments.length === 0;

  return (
    <section className="py-8" aria-label="募集一覧">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          {isEmpty ? "すきまサポート（30分〜）" : "募集一覧"}
        </h2>
        <Link href="/recruitments" className="text-sm text-[var(--accent)] hover:underline">
          すべて見る →
        </Link>
      </div>

      {loading ? (
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 w-[160px] shrink-0 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-700"
            />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {SUPPORT_CARDS.map((m, i) => (
            <Link
              key={i}
              href={m.href}
              className="flex w-[140px] shrink-0 flex-col rounded-2xl border border-[var(--border)] p-3 text-left shadow-sm transition-shadow hover:shadow-md dark:bg-white/50 dark:border-zinc-600"
            >
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {m.title}
              </p>
              <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">{m.sub}</p>
            </Link>
          ))}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recruitments.slice(0, 6).map((r) => (
            <li key={r.id}>
              <Link
                href={`/recruitments/${r.id}`}
                className="block rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-[var(--background)]"
              >
                <h3 className="line-clamp-2 font-semibold text-zinc-900 dark:text-zinc-100">
                  {r.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                  {r.description}
                </p>
                {r.meeting_place && (
                  <p className="mt-2 truncate text-xs text-zinc-400">📍 {r.meeting_place}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
