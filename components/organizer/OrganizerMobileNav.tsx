"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ORGANIZER_SIDEBAR_NAV_ITEMS,
  ORGANIZER_LITE_NAV_ITEMS,
  organizerSidebarNavIsActive,
} from "@/lib/organizer/organizer-nav";

export default function OrganizerMobileNav({
  variant = "full",
}: {
  variant?: "full" | "lite";
}) {
  const pathname = usePathname() ?? "";
  const navItems = variant === "lite" ? ORGANIZER_LITE_NAV_ITEMS : ORGANIZER_SIDEBAR_NAV_ITEMS;

  return (
    <nav aria-label="主催者メニュー" className="min-[900px]:hidden">
      <ul
        className={cn(
          "grid min-h-[44px]",
          variant === "lite" ? "grid-cols-3" : "grid-cols-5"
        )}
      >
        {navItems.map((item) => {
          const active = organizerSidebarNavIsActive(pathname, item.href);
          const label =
            "shortLabel" in item && item.shortLabel ? item.shortLabel : item.label;
          const badge = "badge" in item ? item.badge : undefined;

          return (
            <li key={item.href} className="min-w-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative -mb-px flex min-h-[44px] touch-manipulation items-center justify-center border-b-2 px-0.5 text-[11px] leading-none tracking-tight transition-colors",
                  active
                    ? "border-[#2D7A4F] font-semibold text-[#1e5c38]"
                    : "border-transparent font-medium text-[#6a7568] active:bg-[#f4f8f5]"
                )}
              >
                <span className="inline-flex max-w-full items-center justify-center gap-0.5">
                  <span className="whitespace-nowrap">{label}</span>
                  {badge ? (
                    <span className="shrink-0 rounded-full bg-[#f5e6a8] px-1 py-px text-[8px] font-bold leading-none text-[#8a6a10]">
                      {badge}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
