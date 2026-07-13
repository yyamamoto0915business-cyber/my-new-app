"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Inbox, Settings } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  ORGANIZER_SIDEBAR_NAV_ITEMS,
  ORGANIZER_LITE_NAV_ITEMS,
  organizerSidebarNavIsActive,
} from "@/lib/organizer/organizer-nav";

const SIDEBAR_ICONS = {
  "/organizer": LayoutDashboard,
  "/organizer/inbox": Inbox,
  "/organizer/settings": Settings,
} as const;

function HamburgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}

function NavDrawerHeader({
  subtitle,
  onClose,
}: {
  subtitle: string;
  onClose: ReactNode;
}) {
  return (
    <div className="relative shrink-0 border-b border-[#e5e8e3] bg-white px-4 pb-4 pt-4">
      <div className="relative z-10 pr-10">
        <div className="flex items-center gap-2">
          <img
            src="/organizer/sidebar-brand-logo-v2.png"
            alt=""
            width={32}
            height={32}
            decoding="async"
            className="block h-8 w-8 shrink-0 object-contain"
            aria-hidden
          />
          <p className="text-[17px] font-semibold text-[#1e3828]">MachiGlyph</p>
        </div>
        <p className="mt-1 pl-10 text-[10px] font-medium tracking-[0.14em] text-[#8a9488]">{subtitle}</p>
      </div>
      {onClose}
    </div>
  );
}

export default function OrganizerMobileNav({
  variant = "full",
  organizerName: _organizerName,
  unreadCount = 0,
  isPro: _isPro,
  stripeNotSetup: _stripeNotSetup,
}: {
  variant?: "full" | "lite";
  isPro?: boolean;
  organizerName?: string;
  unreadCount?: number;
  stripeNotSetup?: boolean;
}) {
  const pathname = usePathname();
  const navItems = variant === "lite" ? ORGANIZER_LITE_NAV_ITEMS : ORGANIZER_SIDEBAR_NAV_ITEMS;
  const subtitle = variant === "lite" ? "主催者ページ" : "主催者管理";

  const closeButton = (
    <SheetClose
      render={
        <button
          type="button"
          className="absolute right-3.5 top-3.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e5e8e3] bg-[#f8faf8] text-[#6a7568] transition-colors active:scale-95"
          aria-label="メニューを閉じる"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      }
    />
  );

  return (
    <div className="shrink-0 min-[900px]:hidden">
      <Sheet>
        <SheetTrigger
          render={
            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-[#e8e6e0] bg-white text-[#6b6560] shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all active:scale-[0.97]"
              aria-label="メニューを開く"
            >
              <HamburgerIcon />
            </button>
          }
        />

        <SheetContent
          side="left"
          className="flex !w-[min(72vw,260px)] !max-w-[260px] flex-col gap-0 border-0 bg-[#f9f9f7] p-0 shadow-[4px_0_20px_rgba(26,34,20,0.08)]"
          showCloseButton={false}
        >
          <NavDrawerHeader subtitle={subtitle} onClose={closeButton} />

          <nav className="min-h-0 flex-1 overflow-y-auto px-2.5 py-2.5" aria-label="主催者メニュー">
            <ul className="flex flex-col gap-0.5">
              {navItems.map((item) => {
                const active = organizerSidebarNavIsActive(pathname ?? "", item.href);
                const badge =
                  item.href === "/organizer/inbox" && unreadCount > 0 ? unreadCount : null;
                const Icon =
                  variant === "full" && item.href in SIDEBAR_ICONS
                    ? SIDEBAR_ICONS[item.href as keyof typeof SIDEBAR_ICONS]
                    : null;

                return (
                  <li key={item.href}>
                    <SheetClose
                      nativeButton={false}
                      render={
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] leading-snug transition-all duration-150",
                            active
                              ? "bg-[#EAF4ED] font-semibold text-[#1e5c38]"
                              : "text-[#4a5548] active:bg-white/80"
                          )}
                        >
                          {Icon ? (
                            <Icon
                              size={17}
                              className={cn("shrink-0", active ? "text-[#2D7A4F]" : "text-[#7a8a7e]")}
                              strokeWidth={active ? 2.25 : 1.75}
                              aria-hidden
                            />
                          ) : null}
                          <span className="min-w-0 flex-1 tracking-[0.01em]">{item.label}</span>
                          {badge != null && (
                            <span className="shrink-0 rounded-full bg-[#fde8ed] px-2 py-0.5 text-[10px] font-semibold tabular-nums text-[#c04060]">
                              {badge > 99 ? "99+" : badge}
                            </span>
                          )}
                        </Link>
                      }
                    />
                  </li>
                );
              })}
            </ul>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
