"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "./language-provider";
import { ProfileLink } from "./profile-link";
import {
  getModeFromCookie,
  setModeCookie,
  getRedirectPathForMode,
} from "@/lib/mode-preference";

export function ModeSelectionScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const mode = getModeFromCookie();
    if (mode) {
      router.replace(getRedirectPathForMode(mode));
      // リダイレクトが完了しない場合に備え、一定時間でフォールバック
      const fallback = setTimeout(() => setChecking(false), 2500);
      return () => clearTimeout(fallback);
    }
    setChecking(false);
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  const handleSelect = (mode: "EVENT" | "VOLUNTEER" | "ORGANIZER") => {
    setModeCookie(mode);
    router.push(getRedirectPathForMode(mode));
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-8">
      <header className="mb-6 flex w-full max-w-md items-center justify-end gap-2">
        <ProfileLink />
      </header>

      <main className="flex w-full max-w-md flex-1 flex-col">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          今日はどの立場で使いますか？
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          あとから切り替えられます
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => handleSelect("VOLUNTEER")}
            className="flex flex-col items-start rounded-2xl border-2 border-zinc-200 bg-white p-5 text-left transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-[var(--accent)]"
          >
            <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {t.modeVolunteer}
            </span>
            <span className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {t.modeVolunteerDesc}
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleSelect("EVENT")}
            className="flex flex-col items-start rounded-2xl border-2 border-zinc-200 bg-white p-5 text-left transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-[var(--accent)]"
          >
            <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {t.modeEvent}
            </span>
            <span className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {t.modeEventDesc}
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleSelect("ORGANIZER")}
            className="flex flex-col items-start rounded-2xl border-2 border-zinc-200 bg-white p-5 text-left transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-[var(--accent)]"
          >
            <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {t.modeOrganizer}
            </span>
            <span className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {t.modeOrganizerDesc}
            </span>
          </button>
        </div>

        <div className="mt-8">
          <Link
            href="/events"
            onClick={() => setModeCookie(null)}
            className="block w-full rounded-xl border-2 border-zinc-200 py-3 text-center text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            あとで選ぶ（まずイベントを見る）
          </Link>
        </div>
      </main>
    </div>
  );
}
