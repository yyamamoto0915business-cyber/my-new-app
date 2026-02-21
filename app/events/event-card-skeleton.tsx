export function EventCardSkeleton() {
  return (
    <div className="border-b border-zinc-200 py-6 dark:border-zinc-700">
      <div className="flex gap-2">
        <div className="h-5 w-14 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-5 w-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>
      <div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      <div className="mt-2 h-4 w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
      <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
      <div className="mt-4 space-y-2">
        <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-4 w-1/4 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>
      <div className="mt-4 h-5 w-20 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
    </div>
  );
}
