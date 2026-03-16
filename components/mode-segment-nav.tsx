"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getModeFromCookie } from "@/lib/mode-preference";

const MODE_ITEMS = [
  { id: "discover" as const, label: "探す", href: "/" },
  { id: "volunteer" as const, label: "ボランティア", href: "/volunteer" },
  { id: "organizer" as const, label: "主催", href: "/organizer/events" },
] as const;

export type ModeId = (typeof MODE_ITEMS)[number]["id"];

/** パス名から現在のモードを判定（上部セグメント・下部ホームのactive/href決定用） */
export function getActiveMode(pathname: string): ModeId {
  // URL で明確にモードが分かる場合はそれを優先
  if (pathname.startsWith("/organizer")) return "organizer";
  if (pathname.startsWith("/volunteer") || pathname.startsWith("/recruitments")) return "volunteer";

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
  const pathname = usePathname();
  const activeMode = getActiveMode(pathname ?? "");

  return (
    <nav
      className="fixed left-0 right-0 top-0 z-40 flex bg-white/95 pt-[env(safe-area-inset-top,0px)] backdrop-blur-sm sm:hidden dark:bg-[var(--background)]"
      aria-label="モード切替"
    >
      <div className="mx-auto flex w-full max-w-lg pr-20 sm:pr-0">
        {MODE_ITEMS.map((item) => {
          const isActive = activeMode === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex min-h-[48px] min-w-[80px] flex-1 items-center justify-center py-3 text-sm font-medium transition-colors active:opacity-80 ${
                isActive
                  ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
                  : "text-[var(--foreground-muted)] hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
