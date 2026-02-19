"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "./language-provider";
import { ProfileLink } from "./profile-link";
import { ShareButton } from "./share-button";
import { HomeEventCards } from "./home-event-cards";
import { HomeRecruitmentCards } from "./home-recruitment-cards";
import { Suspense } from "react";

type Mode = "event" | "volunteer" | "organizer";

export function HomePageContent() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>("event");

  return (
    <>
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
            {t.platformTitle}
          </h1>
          <div className="flex items-center gap-2">
            <ShareButton url="/" title={t.platformTitle} variant="compact" />
            <ProfileLink />
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden rounded-2xl shadow-xl">
        <div className="relative h-[160px] sm:h-[200px] w-full">
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
            <h2 className="text-xl font-bold tracking-tight text-white drop-shadow-lg sm:text-2xl">
              {t.platformSubtitle}
            </h2>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {t.selectMode}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setMode("event")}
            className={`flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all sm:p-5 ${
              mode === "event"
                ? "border-[var(--accent)] bg-[var(--accent)]/10 dark:bg-[var(--accent)]/20"
                : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800/80 dark:hover:border-zinc-600"
            }`}
          >
            <span
              className={`text-base font-semibold sm:text-lg ${
                mode === "event"
                  ? "text-[var(--accent)]"
                  : "text-zinc-900 dark:text-zinc-100"
              }`}
            >
              {t.modeEvent}
            </span>
            <span className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {t.modeEventDesc}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMode("volunteer")}
            className={`flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all sm:p-5 ${
              mode === "volunteer"
                ? "border-[var(--accent)] bg-[var(--accent)]/10 dark:bg-[var(--accent)]/20"
                : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800/80 dark:hover:border-zinc-600"
            }`}
          >
            <span
              className={`text-base font-semibold sm:text-lg ${
                mode === "volunteer"
                  ? "text-[var(--accent)]"
                  : "text-zinc-900 dark:text-zinc-100"
              }`}
            >
              {t.modeVolunteer}
            </span>
            <span className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {t.modeVolunteerDesc}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMode("organizer")}
            className={`flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all sm:p-5 ${
              mode === "organizer"
                ? "border-[var(--accent)] bg-[var(--accent)]/10 dark:bg-[var(--accent)]/20"
                : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800/80 dark:hover:border-zinc-600"
            }`}
          >
            <span
              className={`text-base font-semibold sm:text-lg ${
                mode === "organizer"
                  ? "text-[var(--accent)]"
                  : "text-zinc-900 dark:text-zinc-100"
              }`}
            >
              {t.modeOrganizer}
            </span>
            <span className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {t.modeOrganizerDesc}
            </span>
          </button>
        </div>

        {mode === "event" && (
          <div className="space-y-4 rounded-xl border border-zinc-200/60 bg-white/80 p-4 dark:border-zinc-700/60 dark:bg-zinc-900/80 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {t.sectionEvents}
              </h3>
              <Link
                href="/events"
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
              >
                {t.viewAllEvents}
              </Link>
            </div>
            <Suspense
              fallback={
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="aspect-[16/10] animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800"
                    />
                  ))}
                </div>
              }
            >
              <HomeEventCards />
            </Suspense>
            <Link
              href="/event-requests"
              className="block rounded-lg border border-zinc-200 py-2.5 text-center text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {t.eventRequests}
            </Link>
          </div>
        )}

        {mode === "volunteer" && (
          <div className="space-y-4 rounded-xl border border-zinc-200/60 bg-white/80 p-4 dark:border-zinc-700/60 dark:bg-zinc-900/80 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {t.sectionRecruitments}
              </h3>
              <Link
                href="/recruitments"
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
              >
                {t.viewAllRecruitments}
              </Link>
            </div>
            <Suspense
              fallback={
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-36 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800"
                    />
                  ))}
                </div>
              }
            >
              <HomeRecruitmentCards />
            </Suspense>
          </div>
        )}

        {mode === "organizer" && (
          <div className="space-y-4 rounded-xl border border-zinc-200/60 bg-white/80 p-4 dark:border-zinc-700/60 dark:bg-zinc-900/80 sm:p-5">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {t.forOrganizers}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                href="/organizer/events/new"
                className="flex flex-col rounded-xl border-2 border-zinc-200 p-4 transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 dark:border-zinc-600 dark:hover:border-[var(--accent)] dark:hover:bg-[var(--accent)]/10"
              >
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  イベントを新規登録
                </span>
                <span className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  開催するイベントを登録する
                </span>
              </Link>
              <Link
                href="/organizer/events"
                className="flex flex-col rounded-xl border-2 border-zinc-200 p-4 transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 dark:border-zinc-600 dark:hover:border-[var(--accent)] dark:hover:bg-[var(--accent)]/10"
              >
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  イベント一覧
                </span>
                <span className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  登録したイベントを管理する
                </span>
              </Link>
              <Link
                href="/organizer/recruitments/new"
                className="flex flex-col rounded-xl border-2 border-zinc-200 p-4 transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 dark:border-zinc-600 dark:hover:border-[var(--accent)] dark:hover:bg-[var(--accent)]/10"
              >
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  募集を新規登録
                </span>
                <span className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  ボランティア・スポットバイトを募集する
                </span>
              </Link>
              <Link
                href="/organizer/recruitments"
                className="flex flex-col rounded-xl border-2 border-zinc-200 p-4 transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 dark:border-zinc-600 dark:hover:border-[var(--accent)] dark:hover:bg-[var(--accent)]/10"
              >
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  募集一覧
                </span>
                <span className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  登録した募集を管理する
                </span>
              </Link>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
