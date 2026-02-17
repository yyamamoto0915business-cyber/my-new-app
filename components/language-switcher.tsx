"use client";

import { useLanguage } from "./language-provider";
import type { Locale } from "@/lib/i18n";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLanguage();

  return (
    <div className={`flex rounded-lg border border-zinc-200/60 bg-white/80 dark:border-zinc-700/60 dark:bg-zinc-800/80 ${className}`}>
      <button
        type="button"
        onClick={() => setLocale("ja")}
        className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-l-md ${
          locale === "ja"
            ? "bg-[var(--accent)] text-white"
            : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
        }`}
        aria-pressed={locale === "ja"}
      >
        JA
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-r-md ${
          locale === "en"
            ? "bg-[var(--accent)] text-white"
            : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
        }`}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
    </div>
  );
}
