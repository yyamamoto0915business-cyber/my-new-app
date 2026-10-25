"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ORGANIZER_SIDEBAR_NAV_ITEMS,
  ORGANIZER_LITE_NAV_ITEMS,
  organizerSidebarNavIsActive,
  type OrganizerNavVariant,
} from "@/lib/organizer/organizer-nav";
import {
  OrganizerSidebarAdminIcon,
  OrganizerSidebarBackIcon,
  OrganizerSidebarBrandLogo,
  OrganizerSidebarDashboardIcon,
  OrganizerSidebarListingsIcon,
  OrganizerSidebarPlanIcon,
  OrganizerSidebarGamesIcon,
  OrganizerSidebarPosIcon,
} from "@/components/organizer/OrganizerSidebarIcons";

const SIDEBAR_ICONS = {
  "/organizer/listings": OrganizerSidebarListingsIcon,
  "/organizer": OrganizerSidebarDashboardIcon,
  "/organizer/pos": OrganizerSidebarPosIcon,
  "/organizer/games": OrganizerSidebarGamesIcon,
  "/organizer/settings/plan": OrganizerSidebarPlanIcon,
} as const;

const SIDEBAR_OPEN_KEY = "org-sidebar-open";

/** 主催者 PC サイドバー — モック準拠カード型。PCでは閉じて本文を広げられる */
export default function OrganizerSidebar({
  variant = "full",
  showAdminLink = false,
}: {
  variant?: OrganizerNavVariant;
  showAdminLink?: boolean;
}) {
  const pathname = usePathname();
  const navItems = variant === "lite" ? ORGANIZER_LITE_NAV_ITEMS : ORGANIZER_SIDEBAR_NAV_ITEMS;
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (localStorage.getItem(SIDEBAR_OPEN_KEY) === "0") setOpen(false);
  }, []);

  // 閉じているときに本文側の見た目（ゲーム作成のプレビューを大きくする など）を変えられるよう、html に印を付ける。
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.orgSidebar = open ? "open" : "closed";
    return () => {
      delete root.dataset.orgSidebar;
    };
  }, [open]);

  function setSidebarOpen(next: boolean) {
    setOpen(next);
    localStorage.setItem(SIDEBAR_OPEN_KEY, next ? "1" : "0");
  }

  const asideClass = cn(
    "org-sidebar hidden min-[900px]:sticky min-[900px]:top-0 min-[900px]:z-20 min-[900px]:flex min-[900px]:shrink-0 min-[900px]:self-start min-[900px]:flex-col min-[900px]:pb-3 min-[900px]:pt-2",
    open
      ? "min-[900px]:w-[252px] min-[900px]:px-3"
      : "min-[900px]:w-auto min-[900px]:px-1.5"
  );

  if (!open) {
    return (
      <aside className={asideClass}>
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-expanded={false}
          aria-label="メニューを開く"
          className="flex w-11 flex-col items-center gap-1 rounded-2xl border border-[#cfe0d6] bg-white px-1 py-2.5 text-[#2d5a3f] shadow-[0_2px_16px_rgba(30,56,40,0.07)] transition hover:bg-[#f8fbf9] active:bg-[#f0f6f2]"
        >
          <ChevronRight size={16} strokeWidth={2.2} aria-hidden />
          <span className="text-[10px] font-semibold leading-tight">メニュー</span>
        </button>
      </aside>
    );
  }

  return (
    <aside className={asideClass}>
      <div className="flex flex-col overflow-hidden rounded-[20px] border border-[#cfe0d6] bg-white shadow-[0_2px_16px_rgba(30,56,40,0.07)]">
        <div className="org-sidebar__brand shrink-0 px-4 pt-4 pb-4">
          <div className="flex min-h-11 items-center gap-2.5">
            <OrganizerSidebarBrandLogo />
            <div className="min-w-0 flex-1">
              <p className="text-[16px] font-bold tracking-tight text-[#1a4d32]">MachiGlyph</p>
              <p className="text-[11px] font-medium text-[#7a9485]">
                {variant === "lite" ? "主催者ページ" : "主催者管理"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-expanded={true}
              aria-label="メニューを閉じる"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#5a8f6e] transition hover:bg-[#f4f8f5] active:bg-[#eaf4ed]"
            >
              <ChevronLeft size={18} strokeWidth={2.2} aria-hidden />
            </button>
          </div>
        </div>

        <nav className="shrink-0 px-3 pt-0.5 pb-1" aria-label="主催者メニュー">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = organizerSidebarNavIsActive(pathname ?? "", item.href);
              const Icon =
                variant === "full" && item.href in SIDEBAR_ICONS
                  ? SIDEBAR_ICONS[item.href as keyof typeof SIDEBAR_ICONS]
                  : null;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex w-full min-w-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] leading-snug transition-all duration-150",
                      active
                        ? "bg-[#E8F3EC] font-semibold text-[#1a4d32] shadow-[0_1px_4px_rgba(45,90,63,0.1)]"
                        : "font-medium text-[#2d5a3f] hover:bg-[#f4f8f5] active:bg-[#eaf4ed]/70"
                    )}
                  >
                    {Icon ? (
                      <Icon active={active} />
                    ) : (
                      <span className="w-[22px] shrink-0" aria-hidden />
                    )}
                    <span className="min-w-0 flex-1 break-keep leading-snug">
                      {item.label}
                    </span>
                    {"badge" in item && item.badge ? (
                      <span className="shrink-0 rounded-full bg-[#f5e6a8] px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[#8a6a10]">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="shrink-0 space-y-2 border-t border-[#e8ede9] px-3 py-2.5">
          {showAdminLink && (
            <Link
              href="/admin"
              className="flex w-full items-center gap-2.5 rounded-xl bg-[#2d5a3f] px-3 py-2.5 text-[13px] font-semibold text-white shadow-[0_1px_3px_rgba(30,56,40,0.2)] transition hover:bg-[#264f37] active:bg-[#1f422e]"
            >
              <OrganizerSidebarAdminIcon />
              <span className="min-w-0 flex-1">管理者画面</span>
              <ChevronRight size={16} className="shrink-0 opacity-90" aria-hidden />
            </Link>
          )}
          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#b8d4c4] bg-white px-3 py-2.5 text-[13px] font-semibold text-[#2d5a3f] transition hover:bg-[#f8fbf9] active:bg-[#f0f6f2]"
          >
            <OrganizerSidebarBackIcon />
            サイトへ戻る
          </Link>
        </div>
      </div>
    </aside>
  );
}
