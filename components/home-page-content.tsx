"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "./language-provider";
import { ProfileLink } from "./profile-link";
import { ShareButton } from "./share-button";
import { HomeEventCards } from "./home-event-cards";
import { Suspense } from "react";

export function HomePageContent() {
  const { t } = useLanguage();

  const navLinkClass =
    "inline-flex items-center rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700";

  return (
    <>
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
            {t.event}
          </h1>
          <div className="flex items-center gap-2">
            <ShareButton url="/" title={t.platformTitle} variant="compact" />
            <ProfileLink />
          </div>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="メインメニュー">
          <Link href="/events" className={navLinkClass}>
            イベント一覧
          </Link>
          <Link href="/event-requests" className={navLinkClass}>
            {t.eventRequests}
          </Link>
          <Link href="/recruitments" className={navLinkClass}>
            {t.recruitments}
          </Link>
          <Link href="/organizer/events" className={`${navLinkClass} border-zinc-300 dark:border-zinc-500`}>
            {t.forOrganizers}
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
              {t.platformTitle}
            </h2>
            <p className="mt-2 text-sm font-medium text-white/95 drop-shadow-md sm:text-base">
              {t.platformSubtitle}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="aspect-[16/10] animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800"
                />
              ))}
            </div>
          }
        >
          <HomeEventCards />
        </Suspense>
      </section>

      <div className="flex justify-center pt-4">
        <Link
          href="/events"
          className="rounded-xl bg-[var(--accent)] px-8 py-3 text-center font-medium text-white shadow-md transition-colors hover:bg-[var(--accent-hover)] dark:shadow-zinc-900/50"
        >
          {t.viewAllEvents}
        </Link>
      </div>
    </>
  );
}
