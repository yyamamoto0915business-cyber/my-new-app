"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "./language-provider";
import { ProfileLink } from "./profile-link";
import {
  getModeFromCookie,
  setModeCookie,
  getRedirectPathForMode,
} from "@/lib/mode-preference";
import { useSearchParamsNoSuspend } from "@/lib/use-search-params-no-suspend";

const cardClass =
  "flex flex-col items-start rounded-2xl border-2 border-zinc-200 bg-white p-6 text-left shadow-sm transition-all hover:border-[var(--accent)] hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-[var(--accent)]";

export function ModeSelectionScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const searchParams = useSearchParamsNoSuspend();
  const forceSelect = searchParams.get("mode") === "select";

  useEffect(() => {
    try {
      if (forceSelect) {
        setModeCookie(null);
        return;
      }
      const mode = getModeFromCookie();
      if (mode) {
        router.replace(getRedirectPathForMode(mode));
      }
    } catch {
      // クッキー読み取りエラー時はそのままモード選択を表示
    }
  }, [router, forceSelect]);

  const handleSelect = (mode: "EVENT" | "VOLUNTEER" | "ORGANIZER") => {
    setModeCookie(mode);
    router.push(getRedirectPathForMode(mode));
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex justify-end px-4 pt-4">
        <ProfileLink />
      </header>
      <section className="relative overflow-hidden rounded-b-2xl">
        <div className="relative h-[100px] w-full sm:h-[120px]">
          <Image
            src="/hero-festival-illustration.png"
            alt=""
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
            <h1 className="text-lg font-bold tracking-tight text-white drop-shadow-md sm:text-xl">
              ようこそ、地域のイベントを探してみよう
            </h1>
            <p className="mt-0.5 text-xs text-white/90 drop-shadow sm:text-sm">
              あとから切り替えられます
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <p className="mb-5 text-center text-sm text-zinc-500 dark:text-zinc-400">
          利用する立場を選んでください
        </p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => handleSelect("VOLUNTEER")}
            className={cardClass}
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
              aria-hidden
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </span>
            <span className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {t.modeVolunteer}
            </span>
            <span className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {t.modeVolunteerDesc}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelect("EVENT")}
            className={cardClass}
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
              aria-hidden
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </span>
            <span className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {t.modeEvent}
            </span>
            <span className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {t.modeEventDesc}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelect("ORGANIZER")}
            className={cardClass}
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
              aria-hidden
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                />
              </svg>
            </span>
            <span className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {t.modeOrganizer}
            </span>
            <span className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {t.modeOrganizerDesc}
            </span>
          </button>
        </div>

        <div className="mt-6">
          <Link
            href="/events"
            onClick={() => setModeCookie(null)}
            className="block w-full rounded-xl border-2 border-dashed border-zinc-200 py-3.5 text-center text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/50"
          >
            あとで選ぶ（まずイベントを見る）
          </Link>
        </div>
      </main>
    </div>
  );
}
