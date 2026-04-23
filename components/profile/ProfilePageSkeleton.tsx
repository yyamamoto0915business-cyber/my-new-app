/** マイページの初期表示用スケルトン（ルート loading とクライアント取得中で共通） */
export function ProfilePageSkeleton() {
  return (
    <div className="relative mx-auto min-h-screen max-w-3xl bg-zinc-50 px-4 py-6 pb-24 dark:bg-zinc-950 sm:pb-8">
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-end">
          <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-700/60 dark:bg-zinc-900/95">
          <div className="flex gap-4">
            <div className="h-20 w-20 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            <div className="min-w-0 flex-1 space-y-3 pt-1">
              <div className="h-6 w-40 rounded-md bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-4 w-full rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-9 w-full rounded-xl bg-zinc-100 dark:bg-zinc-800" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 rounded-2xl bg-zinc-200/80 dark:bg-zinc-800" />
          <div className="h-24 rounded-2xl bg-zinc-200/80 dark:bg-zinc-800" />
          <div className="h-24 rounded-2xl bg-zinc-200/80 dark:bg-zinc-800" />
          <div className="h-24 rounded-2xl bg-zinc-200/80 dark:bg-zinc-800" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-32 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}
