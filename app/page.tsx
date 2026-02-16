import Link from "next/link";
import Image from "next/image";
import { HomeEventCards } from "@/components/home-event-cards";
import { FallingCherryBlossoms } from "@/components/falling-cherry-blossoms";
import { ProfileLink } from "@/components/profile-link";
import { ShareButton } from "@/components/share-button";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center px-4 py-6 sm:py-8">
      <FallingCherryBlossoms />
      <main className="relative z-10 w-full max-w-2xl space-y-6 lg:max-w-5xl xl:max-w-6xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
            イベント
          </h1>
          <nav className="flex flex-wrap items-center gap-3">
            <ShareButton
              url="/"
              title="地域イベントプラットフォーム"
              variant="compact"
            />
            <ProfileLink />
            <Link
              href="/organizer/events"
              className="text-sm text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              主催者向け
            </Link>
          </nav>
        </header>

        <section className="relative overflow-hidden rounded-2xl shadow-xl">
          <div className="relative h-[180px] sm:h-[220px] w-full">
            <Image
              src="/hero-festival.jpg"
              alt=""
              fill
              className="object-cover"
              priority
              sizes="(max-width: 640px) 100vw, 672px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-lg sm:text-3xl">
                地域イベントプラットフォーム
              </h2>
              <p className="mt-2 text-sm font-medium text-white/95 drop-shadow-md sm:text-base">
                地域のイベントを探して、参加しよう
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <HomeEventCards />
        </section>

        <div className="flex justify-center pt-4">
          <Link
            href="/events"
            className="rounded-xl bg-[var(--accent)] px-8 py-3 text-center font-medium text-white shadow-md transition-colors hover:bg-[var(--accent-hover)] dark:shadow-zinc-900/50"
          >
            すべてのイベントを見る
          </Link>
        </div>
      </main>
    </div>
  );
}
