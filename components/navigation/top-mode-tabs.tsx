"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { usePathname } from "next/navigation";
import { Search, HandHeart, BriefcaseBusiness } from "lucide-react";
import { cn } from "@/lib/utils";

export type TopModeTabId = "discover" | "volunteer" | "organizer";

const TABS = [
  {
    id: "discover" as const,
    label: "探す",
    href: "/",
    icon: Search,
    active: "bg-rose-50 text-rose-600 shadow-sm border-rose-100",
    pressed: "active:bg-rose-100/80",
  },
  {
    id: "volunteer" as const,
    label: "ボランティア",
    href: "/volunteer",
    icon: HandHeart,
    active: "bg-blue-50 text-blue-600 shadow-sm border-blue-100",
    pressed: "active:bg-blue-100/80",
  },
  {
    id: "organizer" as const,
    label: "主催",
    href: "/organizer",
    icon: BriefcaseBusiness,
    active: "bg-green-50 text-green-700 shadow-sm border-green-100",
    pressed: "active:bg-green-100/80",
  },
] as const satisfies ReadonlyArray<{
  id: TopModeTabId;
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  active: string;
  pressed: string;
}>;

type Props = {
  onTabClick?: (id: TopModeTabId) => void;
  className?: string;
  /** 主催エリアなど、上部を詰めたいとき用 */
  compact?: boolean;
  /** 主催ルート時、「主催」タブの選択状態を強調 */
  emphasizeOrganizerActive?: boolean;
};

function getActiveIdFromPathname(pathname: string): TopModeTabId {
  if (pathname.startsWith("/organizer")) return "organizer";
  if (pathname.startsWith("/volunteer")) return "volunteer";
  return "discover";
}

export function TopModeTabs({ onTabClick, className, compact, emphasizeOrganizerActive }: Props) {
  const pathname = usePathname();
  const activeId = getActiveIdFromPathname(pathname ?? "");
  return (
    <div
      className={cn(
        "flex min-w-0 gap-1.5 rounded-[24px] bg-[#e4ede0]/70 p-1 backdrop-blur supports-[backdrop-filter]:bg-[#e4ede0]/60",
        compact && "rounded-[20px] gap-1 p-0.5",
        className
      )}
    >
      {TABS.map((tab) => {
        const isActive = activeId === tab.id;
        const Icon = tab.icon;
        const isVolunteer = tab.id === "volunteer";
        return (
          <Link
            key={tab.id}
            href={tab.href}
            prefetch
            onClick={() => onTabClick?.(tab.id)}
            className={cn(
              "flex touch-manipulation items-center justify-center gap-1.5 font-medium leading-none transition-all duration-200 select-none",
              "border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3848]/40 focus-visible:ring-offset-1",
              "active:scale-[0.98]",
              compact
                ? "min-h-[34px] rounded-[20px] px-3 py-[7px] text-[12px]"
                : "min-h-[34px] rounded-[20px] px-[14px] py-[7px] text-[12px]",
              isVolunteer ? "shrink-0" : "min-w-0 flex-1",
              isActive
                ? cn(
                    "border-[#1e3848] bg-[#1e3848] text-[#f4f0e8] shadow-sm",
                    emphasizeOrganizerActive &&
                      tab.id === "organizer" &&
                      "ring-2 ring-[#1e3848]/40 ring-offset-1"
                  )
                : "border-transparent bg-white/60 text-[#2e2820] active:bg-white/80"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon
              className={cn(
                "shrink-0",
                compact ? "h-3.5 w-3.5" : "h-3.5 w-3.5"
              )}
            />
            <span className={isVolunteer ? "whitespace-nowrap" : "truncate"}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

