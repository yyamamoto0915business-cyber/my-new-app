"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Search, HandHeart, BriefcaseBusiness } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrganizerPro } from "@/lib/organizer-pro-store";
import {
  getTopModeTabIdFromContext,
  isDiscoverPath,
  isOrganizerDashboardPath,
  resolveAuthReturnPath,
  type TopModeTabId,
} from "@/lib/top-mode-active";
import { useModeFromCookie } from "@/hooks/use-mode-from-cookie";

export type { TopModeTabId };

const TABS = [
  {
    id: "discover" as const,
    label: "探す",
    href: "/",
    icon: Search,
  },
  {
    id: "volunteer" as const,
    label: "ボランティア",
    href: "/volunteer",
    icon: HandHeart,
  },
  {
    id: "organizer" as const,
    label: "主催",
    href: "/organizer",
    icon: BriefcaseBusiness,
  },
] as const satisfies ReadonlyArray<{
  id: TopModeTabId;
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}>;

const TAB_BASE =
  "flex touch-manipulation items-center justify-center gap-1.5 border font-medium leading-none transition-all duration-200 select-none rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2a5540]/35 focus-visible:ring-offset-1 active:scale-[0.98]";

const TAB_INACTIVE = "mg-top-mode-tab-inactive active:bg-[#fafaf8]";

const TAB_ACTIVE = "mg-top-mode-tab-active";

type Props = {
  onTabClick?: (id: TopModeTabId) => void;
  className?: string;
  /** 主催エリアなど、上部を詰めたいとき用 */
  compact?: boolean;
};

function tabSizeClass(compact?: boolean) {
  return compact
    ? "min-h-[32px] px-3 py-1 text-[11px]"
    : "min-h-[32px] px-3 py-1 text-[11px]";
}

function tabWidthClass(isVolunteer: boolean) {
  return isVolunteer ? "shrink-0" : "min-w-0 flex-1";
}

export function TopModeTabs({ onTabClick, className, compact }: Props) {
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
    if (pathname.startsWith("/volunteer")) return "volunteer" as const;
    if (isDiscoverPath(pathname)) return "discover" as const;
    // 認証画面は戻り先が主催・ボランティアでない限り「探す」を選択（モックアップ準拠）
    if (pathname === "/auth" || pathname.startsWith("/auth/")) {
      if (returnPath && isOrganizerDashboardPath(returnPath)) return "organizer";
      if (returnPath?.startsWith("/volunteer")) return "volunteer";
      return "discover";
    }
    return getTopModeTabIdFromContext(pathname, returnPath, modeFromCookie);
  })();
  const isProOrganizer = useOrganizerPro();

  return (
    <div
      className={cn(
        "flex min-w-0 items-stretch gap-1.5",
        compact && "gap-1",
        className
      )}
    >
      {TABS.map((tab) => {
        const isActive = activeId === tab.id;
        const Icon = tab.icon;
        const isVolunteer = tab.id === "volunteer";
        const isPaidOrganizerTab = tab.id === "organizer" && isProOrganizer;
        const widthClass = tabWidthClass(isVolunteer);
        const linkClass = cn(
          TAB_BASE,
          tabSizeClass(compact),
          widthClass,
          isActive ? TAB_ACTIVE : TAB_INACTIVE
        );

        if (isPaidOrganizerTab && isActive) {
          return (
            <span key={tab.id} className={cn("relative inline-flex", widthClass)}>
              <Link
                href={tab.href}
                prefetch
                onClick={() => onTabClick?.(tab.id)}
                aria-current={isActive ? "page" : undefined}
                className={cn(linkClass, "w-full")}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </Link>
              <span className="org-pro-tab-badge">PRO</span>
            </span>
          );
        }

        return (
          <Link
            key={tab.id}
            href={tab.href}
            prefetch
            onClick={() => onTabClick?.(tab.id)}
            className={linkClass}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className={isVolunteer ? "whitespace-nowrap" : "truncate"}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
