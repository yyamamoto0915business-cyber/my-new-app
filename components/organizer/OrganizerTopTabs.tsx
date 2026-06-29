"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ORGANIZER_TOP_TAB_ITEMS,
  organizerTopTabIsActive,
} from "@/lib/organizer/organizer-nav";

/** 主催者管理 — メインエリア上部の5タブ */
export function OrganizerTopTabs({ className }: { className?: string }) {
  const pathname = usePathname() ?? "";

  return (
    <nav
      className={cn("org-top-tabs", className)}
      aria-label="主催者管理メニュー"
    >
      <div className="org-top-tabs__scroll">
        {ORGANIZER_TOP_TAB_ITEMS.map((item, index) => {
          const active = organizerTopTabIsActive(pathname, item.href);
          const isLast = index === ORGANIZER_TOP_TAB_ITEMS.length - 1;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "org-top-tabs__tab",
                active && "is-active",
                !isLast && "org-top-tabs__tab--divided"
              )}
              aria-current={active ? "page" : undefined}
            >
              <span className="org-top-tabs__tab-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
