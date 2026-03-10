"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SectionHeader } from "./SectionHeader";

type Recruitment = {
  id: string;
  organizer_id?: string;
  title: string;
  description: string;
  meeting_place: string | null;
  start_at?: string | null;
  organizers?: { organization_name: string | null };
  events?: { title: string; date: string } | null;
};

type Props = {
  recruitments: Recruitment[];
  loading?: boolean;
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ja-JP", {
      month: "numeric",
      day: "numeric",
      weekday: "short",
    });
  } catch {
    return "";
  }
}

function RecruitmentCard({ recruitment: r }: { recruitment: Recruitment }) {
  const router = useRouter();
  const handleClick = () => router.push(`/recruitments/${r.id}`);

  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
        className="block cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-700 dark:bg-[var(--background)]"
      >
        <h3 className="line-clamp-2 font-semibold text-zinc-900 dark:text-zinc-100">
          {r.title}
        </h3>
        {(r.organizers?.organization_name || r.events?.title) && (
          <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
            {r.events?.title && (
              <span className="text-zinc-600 dark:text-zinc-300">
                {r.events.title}
              </span>
            )}
            {r.events?.title && r.organizers?.organization_name && " / "}
            {r.organizers?.organization_name && (
              <span>
                {r.organizer_id ? (
                  <Link
                    href={`/organizers/${r.organizer_id}`}
                    className="hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {r.organizers.organization_name}
                  </Link>
                ) : (
                  r.organizers.organization_name
                )}
              </span>
            )}
          </p>
        )}
        <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
          {r.description}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-400">
          {r.start_at && <span>{formatDate(r.start_at)}</span>}
          {r.meeting_place && (
            <span className="truncate">📍 {r.meeting_place}</span>
          )}
        </div>
      </div>
    </li>
  );
}

export function RecruitmentOrMissions({ recruitments, loading }: Props) {
  const isEmpty = !loading && recruitments.length === 0;
  const display = recruitments.slice(0, 6);

  if (loading) {
    return (
      <section className="space-y-4" aria-label="募集中の活動">
        <SectionHeader
          title="募集中の活動"
          subtitle="参加やお手伝いを募集している活動です"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-[120px] animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-700"
            />
          ))}
        </div>
      </section>
    );
  }

  if (isEmpty) {
    return (
      <section className="space-y-4" aria-label="募集中の活動">
        <SectionHeader
          title="募集中の活動"
          subtitle="参加やお手伝いを募集している活動です"
          href="/recruitments"
          linkLabel="募集一覧を見る"
        />
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">
            現在募集中の活動はありません
          </p>
          <p className="mt-1 text-xs text-slate-400">
            地域のイベントで参加やお手伝いを募集する予定です
          </p>
          <Link
            href="/recruitments"
            className="mt-4 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
          >
            募集一覧を見る →
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4" aria-label="募集中の活動">
      <SectionHeader
        title="募集中の活動"
        subtitle="参加やお手伝いを募集している活動です"
        href="/recruitments"
        linkLabel="もっと見る"
      />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {display.map((r) => (
          <RecruitmentCard key={r.id} recruitment={r} />
        ))}
      </ul>
    </section>
  );
}
