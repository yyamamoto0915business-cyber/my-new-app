"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { usePlayCopy } from "@/components/play/usePlayCopy";

export function PlayLocaleToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="play-locale" role="group" aria-label={locale === "en" ? "Language" : "言語"}>
      <button type="button" aria-pressed={locale === "ja"} onClick={() => setLocale("ja")}>
        JA
      </button>
      <button type="button" aria-pressed={locale === "en"} onClick={() => setLocale("en")}>
        EN
      </button>
    </div>
  );
}

/** ゲーム画面から通常のアプリ画面へ戻る。ゲームの進捗は端末に残る。 */
export function PlayExitLink({ className }: { className?: string }) {
  const copy = usePlayCopy();
  return (
    <Link href="/" className={className ? `play-exit ${className}` : "play-exit"}>
      <ChevronLeft aria-hidden />
      {copy.toApp}
    </Link>
  );
}

export function PlayLocaleSwitch() {
  return (
    <div className="play-locale-bar">
      <PlayExitLink />
      <PlayLocaleToggle />
    </div>
  );
}
