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
    href: "/organizer/events",
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
};

function getActiveIdFromPathname(pathname: string): TopModeTabId {
  if (pathname.startsWith("/organizer")) return "organizer";
  if (pathname.startsWith("/volunteer")) return "volunteer";
  return "discover";
}

export function TopModeTabs({ onTabClick, className }: Props) {
  const pathname = usePathname();
  const activeId = getActiveIdFromPathname(pathname ?? "");
  return (
    <div
      className={cn(
        "rounded-[24px] border border-slate-200 bg-slate-100/80 p-1 shadow-[0_1px_0_rgba(15,23,42,0.03)] backdrop-blur supports-[backdrop-filter]:bg-slate-100/70",
        className
      )}
    >
      <div className="grid grid-cols-3 gap-1">
        {TABS.map((tab) => {
          const isActive = activeId === tab.id;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              onClick={() => onTabClick?.(tab.id)}
              className={cn(
                "flex h-12 w-full items-center justify-center gap-2 rounded-[18px] px-3 text-sm font-semibold leading-none tracking-[-0.01em] transition-all duration-200 select-none",
                "border border-transparent",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--mg-paper)]",
                "active:scale-[0.99]",
                isActive
                  ? cn("border", tab.active, tab.pressed)
                  : "bg-white/30 text-slate-600 active:bg-slate-200/60"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0 translate-y-[0.5px]" />
              <span className="truncate translate-y-[0.5px]">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

