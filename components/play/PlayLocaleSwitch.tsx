"use client";

import { useLanguage } from "@/components/language-provider";

export function PlayLocaleSwitch() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="play-locale-bar">
      <div className="play-locale" role="group" aria-label={locale === "en" ? "Language" : "言語"}>
        <button type="button" aria-pressed={locale === "ja"} onClick={() => setLocale("ja")}>
          JA
        </button>
        <button type="button" aria-pressed={locale === "en"} onClick={() => setLocale("en")}>
          EN
        </button>
      </div>
    </div>
  );
}
