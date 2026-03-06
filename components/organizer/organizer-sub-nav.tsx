"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SUB_NAV_ITEMS = [
  { href: "/organizer/events", label: "イベント", exact: true },
  { href: "/organizer/recruitments", label: "募集管理" },
  { href: "/organizer/stories", label: "ストーリー" },
  { href: "/organizer/settings/billing", label: "課金・請求" },
] as const;

function isActive(pathname: string | null, href: string, exact?: boolean): boolean {
  if (!pathname) return false;
  if (exact) return pathname === href || pathname === `${href}/`;
  return pathname.startsWith(href);
}

/** 主催者サブナビ（ピル/タブ風・横スクロール対応） */
export function OrganizerSubNav() {
  const pathname = usePathname();

  return (
    <nav
      className="-mx-4 mt-3 overflow-x-auto px-4 pb-1 sm:overflow-visible"
      aria-label="主催者メニュー"
    >
      <div className="flex min-w-0 gap-2 py-2">
        {SUB_NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href, "exact" in item && item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "border border-[var(--border)] bg-white text-[var(--foreground-muted)] hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900/50 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
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
