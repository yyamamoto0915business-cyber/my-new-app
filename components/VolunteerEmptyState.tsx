"use client";

type VolunteerEmptyStateProps = {
  onReset?: () => void;
  onViewNewest?: () => void;
  onViewRecommended?: () => void;
};

export function VolunteerEmptyState({
  onReset,
  onViewNewest,
  onViewRecommended,
}: VolunteerEmptyStateProps) {
  return (
    <section className="rounded-2xl border border-zinc-200/60 bg-white/80 p-6 text-center dark:border-zinc-700/60 dark:bg-zinc-900/80">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M10 14l-2 2m5-5l-1 1m4-9l-1 1m-9 0a7 7 0 1011 11"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        条件に合う募集が見つかりませんでした
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        条件を少しゆるめると、参加しやすい募集が見つかるかもしれません
      </p>

      <div className="mt-4 grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={onReset}
          className="min-h-[44px] rounded-xl bg-[var(--accent)] px-3 text-sm font-medium text-white hover:opacity-90"
        >
          フィルターをリセット
        </button>
        <button
          type="button"
          onClick={onViewNewest}
          className="min-h-[44px] rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          新着順で見る
        </button>
        <button
          type="button"
          onClick={onViewRecommended}
          className="min-h-[44px] rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          おすすめを見る
        </button>
      </div>
    </section>
  );
}

