"use client";

type VolunteerHeroProps = {
  totalCount?: number;
  thisWeekCount?: number;
  beginnerFriendlyCount?: number;
  travelSupportCount?: number;
  isLoading?: boolean;
};

function formatCount(count: number | undefined): number | "--" {
  return typeof count === "number" ? count : "--";
}

function SummaryCard({
  label,
  value,
  isLoading,
}: {
  label: string;
  value?: number;
  isLoading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-200/60 bg-white/70 p-3 dark:border-zinc-700/60 dark:bg-zinc-800/50">
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{label}</p>
      {isLoading ? (
        <div className="mt-1 h-7 w-14 animate-pulse rounded bg-zinc-200/60 dark:bg-zinc-700/60" />
      ) : (
        <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {formatCount(value)}
        </p>
      )}
    </div>
  );
}

export function VolunteerHero({
  totalCount,
  thisWeekCount,
  beginnerFriendlyCount,
  travelSupportCount,
  isLoading = false,
}: VolunteerHeroProps) {
  return (
    <section className="mb-6 overflow-hidden rounded-3xl border border-zinc-200/60 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-5 shadow-sm dark:border-zinc-700/60 dark:from-zinc-800 dark:via-zinc-900 dark:to-emerald-900/10 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end">
        <div className="flex-1">
          <p className="text-xs font-medium text-[var(--accent)]">地域イベントを支える</p>
          <h1 className="mt-2 text-2xl font-bold leading-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            ボランティア募集
          </h1>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            1日だけの参加や、交通費・食事つきの募集も探せます。
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            地域で誰かの役に立てる体験を、気軽に見つけられるページにしてください。
          </p>
        </div>

        <div className="w-full self-start lg:w-[360px] lg:self-end">
          <div className="rounded-2xl border border-zinc-200/60 bg-white/80 p-4 shadow-sm dark:border-zinc-700/60 dark:bg-zinc-900/70">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              いま見つかる募集の目安
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <SummaryCard
                label="募集中"
                value={totalCount}
                isLoading={isLoading}
              />
              <SummaryCard
                label="今週開催"
                value={thisWeekCount}
                isLoading={isLoading}
              />
              <SummaryCard
                label="初心者歓迎"
                value={beginnerFriendlyCount}
                isLoading={isLoading}
              />
              <SummaryCard
                label="交通費あり"
                value={travelSupportCount}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

