"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CalendarDays, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getTopModeTabIdFromContext,
  isEventModePath,
  isMachiModePath,
  isOrganizerDashboardPath,
  resolveAuthReturnPath,
  type TopModeTabId,
} from "@/lib/top-mode-active";
import { useModeFromCookie } from "@/hooks/use-mode-from-cookie";

export type { TopModeTabId };

/** 利用者側の2択。主催者モードへは上部の「⇄ 主催者モードへ」ボタンから行く */
const TABS = [
  {
    id: "event" as const,
    label: "まちの情報",
    href: "/",
    icon: CalendarDays,
  },
  {
    id: "machi" as const,
    label: "みんなの投稿",
    href: "/posts",
    icon: Users,
  },
] as const satisfies ReadonlyArray<{
  id: TopModeTabId;
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}>;

type Props = {
  onTabClick?: (id: TopModeTabId) => void;
  className?: string;
};

export function TopModeTabs({ onTabClick, className }: Props) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const modeFromCookie = useModeFromCookie();
  const returnPath = resolveAuthReturnPath(
    searchParams.get("next"),
    searchParams.get("returnTo"),
    searchParams.get("redirect"),
    searchParams.get("callbackUrl")
  );
  const activeId = (() => {
    if (isOrganizerDashboardPath(pathname)) return "organizer" as const;
    if (isMachiModePath(pathname)) return "machi" as const;
    if (isEventModePath(pathname)) return "event" as const;
    // 認証画面は戻り先がみんなの投稿でない限り「まちの情報」を選択
    if (pathname === "/auth" || pathname.startsWith("/auth/")) {
      if (returnPath && isMachiModePath(returnPath)) return "machi";
      return "event";
    }
    return getTopModeTabIdFromContext(pathname, returnPath, modeFromCookie);
  })();

  return (
    <div
      className={cn(
        "flex min-w-0 items-stretch gap-1 rounded-full border border-[#e3ece5] bg-white/90 p-[3px] shadow-[0_3px_10px_rgba(22,56,40,0.07)]",
        className
      )}
    >
      {TABS.map((tab) => {
        const isActive = activeId === tab.id;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            prefetch
            onClick={() => onTabClick?.(tab.id)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-h-[36px] min-w-0 flex-1 basis-0 touch-manipulation select-none items-center justify-center gap-1.5 rounded-full px-3 text-[13px] font-bold leading-none tracking-[0.02em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2a5540]/35 active:scale-[0.98]",
              // 選択中は前と同じ葉っぱ模様（globals.css の mg-top-mode-tab-active）
              isActive
                ? "mg-top-mode-tab-active border-0 text-white shadow-[0_3px_10px_rgba(22,56,40,0.25)]"
                : "text-[#163828] active:bg-[#f4f8f5]"
            )}
          >
            <Icon
              className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-[#2f6b4f]")}
            />
            <span className="whitespace-nowrap">{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
