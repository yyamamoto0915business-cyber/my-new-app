"use client";

import { useLanguage } from "@/components/language-provider";
import { playCopy } from "@/lib/play-copy";

export function usePlayCopy() {
  const { locale } = useLanguage();
  return playCopy(locale);
}
