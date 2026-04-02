"use client";

import { usePathname } from "next/navigation";
import { getModeFromCookie, setModeCookie } from "@/lib/mode-preference";
import { TopModeTabs, type TopModeTabId } from "@/components/navigation/top-mode-tabs";

export type ModeId = "discover" | "volunteer" | "organizer";

/** パス名から現在のモードを判定（上部セグメント・下部ホームのactive/href決定用） */
export function getActiveMode(pathname: string): ModeId {
  // URL で明確にモードが分かる場合はそれを優先
  if (pathname.startsWith("/organizer")) return "organizer";
  if (pathname.startsWith("/volunteer")) return "volunteer";

  // それ以外（ホームなど）の場合はモードクッキーを参照
  const mode = getModeFromCookie();
  if (mode === "ORGANIZER") return "organizer";
  if (mode === "VOLUNTEER") return "volunteer";

  return "discover";
}

/** モード別ホームURL（下部タブのホーム押下先） */
export function getHomeHrefForMode(mode: ModeId): string {
  if (mode === "organizer") return "/organizer/events";
  if (mode === "volunteer") return "/volunteer";
  return "/";
}

/**
 * 画面上部固定の3択セグメント（探す/ボランティア/主催）
 * スマホで常時表示、ワンタップでモード切替
 */
export function ModeSegmentNav() {
  usePathname();

  const handleTabClick = (id: TopModeTabId) => {
    const cookieMode =
      id === "organizer" ? "ORGANIZER" : id === "volunteer" ? "VOLUNTEER" : "EVENT";
    setModeCookie(cookieMode);
  };

  return (
    <nav
      className="fixed left-0 right-0 top-0 z-40 list-none bg-gradient-to-b from-white/90 to-transparent pt-[env(safe-area-inset-top,0px)] pb-2 backdrop-blur-md before:content-none after:content-none sm:hidden dark:from-[var(--background)]/85 dark:to-transparent"
      aria-label="モード切替"
    >
      <div className="mx-auto w-full max-w-screen-sm px-0 sm:max-w-lg">
        <div className="mx-4 mt-1.5">
          <TopModeTabs onTabClick={handleTabClick} />
        </div>
      </div>
    </nav>
  );
}
