"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * いま「新しく掲載 → ゲーム」の種類えらび（/organizer/games?pick=1）を開いているか。
 * ナビで「新しく掲載」を光らせるために使う（useSearchParams を使わず、ページ全体の描き方に影響させない）。
 */
export function useGamePickMode(): boolean {
  const pathname = usePathname() ?? "";
  const [pick, setPick] = useState(false);
  useEffect(() => {
    setPick(
      pathname === "/organizer/games" &&
        new URLSearchParams(window.location.search).get("pick") === "1"
    );
  }, [pathname]);
  return pick;
}
