import Link from "next/link";
import { HomeMapPreview } from "@/components/home-map-preview";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <main className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            地域イベントプラットフォーム
          </h1>
          <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
            地域のイベントを探して、参加しよう
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200/60 bg-white/80 p-6 shadow-lg backdrop-blur-sm dark:border-zinc-700/60 dark:bg-zinc-900/80">
          <div className="w-full text-left">
            <HomeMapPreview />
          </div>
        </div>

        <nav className="flex flex-col gap-4">
          <Link
            href="/events"
            className="rounded-xl bg-[var(--accent)] px-6 py-4 text-center font-medium text-white shadow-md transition-colors hover:bg-[var(--accent-hover)] dark:shadow-zinc-900/50"
          >
            イベント一覧を見る
          </Link>
          <Link
            href="/organizer/events"
            className="rounded-xl border border-zinc-200/60 bg-white/80 px-6 py-4 text-center font-medium backdrop-blur-sm transition-colors hover:bg-zinc-50/80 dark:border-zinc-700/60 dark:bg-zinc-900/50 dark:hover:bg-zinc-800/80"
          >
            主催者：イベント管理
          </Link>
        </nav>
      </main>
    </div>
  );
}
