"use client";

import { useSyncExternalStore } from "react";
import { getModeFromCookie, type ModePreference } from "@/lib/mode-preference";

/** SSR と初回 hydration では null。マウント後に document.cookie を反映する */
export function useModeFromCookie(): ModePreference {
  return useSyncExternalStore(
    () => () => {},
    getModeFromCookie,
    () => null
  );
}
