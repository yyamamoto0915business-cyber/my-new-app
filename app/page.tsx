import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <main className="w-full max-w-lg space-y-8 text-center">
        <h1 className="text-3xl font-bold">地域イベントプラットフォーム</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          地域のイベントを探して参加しよう
        </p>
        <nav className="flex flex-col gap-4">
          <Link
            href="/events"
            className="rounded-lg bg-zinc-900 px-6 py-3 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            イベント一覧を見る
          </Link>
          <Link
            href="/organizer/events"
            className="rounded-lg border border-zinc-300 px-6 py-3 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            主催者：イベント管理
          </Link>
        </nav>
      </main>
    </div>
  );
}
