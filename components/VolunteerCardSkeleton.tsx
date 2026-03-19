"use client";

export function VolunteerCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <section className="space-y-4">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        近くの募集を読み込んでいます…
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-zinc-200/60 bg-white dark:border-zinc-700/60 dark:bg-zinc-900"
          >
            <div className="aspect-[16/9] w-full animate-pulse bg-zinc-200/60 dark:bg-zinc-800/60" />
            <div className="space-y-3 p-4">
              <div className="h-7 w-2/3 animate-pulse rounded bg-zinc-200/60 dark:bg-zinc-800/60" />
              <div className="h-5 w-5/6 animate-pulse rounded bg-zinc-200/60 dark:bg-zinc-800/60" />
              <div className="h-4 w-full animate-pulse rounded bg-zinc-200/60 dark:bg-zinc-800/60" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-zinc-200/60 dark:bg-zinc-800/60" />
              <div className="h-9 w-full animate-pulse rounded bg-zinc-200/60 dark:bg-zinc-800/60" />
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="h-10 animate-pulse rounded bg-zinc-200/60 dark:bg-zinc-800/60" />
                <div className="h-10 animate-pulse rounded bg-zinc-200/60 dark:bg-zinc-800/60" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

