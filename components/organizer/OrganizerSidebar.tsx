"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type OrganizerNavVariant = "full" | "lite";

const FULL_NAV_ITEMS = [
  { label: "ダッシュボード", href: "/organizer" },
  { label: "イベント管理", href: "/organizer/events" },
  { label: "主催者プラン", href: "/organizer/settings/plan" },
  { label: "売上受取", href: "/organizer/settings/payouts" },
  { label: "スタッフ募集", href: "/organizer/recruitments" },
  { label: "記事管理", href: "/organizer/articles" },
  { label: "ストーリー", href: "/organizer/stories" },
  { label: "受信箱", href: "/organizer/inbox" },
  { label: "設定", href: "/organizer/settings" },
] as const;

const LITE_NAV_ITEMS = [
  { label: "主催者登録", href: "/organizer/register" },
  { label: "料金プラン", href: "/organizer/settings/plan" },
  { label: "イベントを探す", href: "/events" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/organizer") {
    return pathname === "/organizer" || pathname === "/organizer/";
  }
  if (href === "/organizer/events") {
    return pathname === "/organizer/events" || pathname === "/organizer/events/";
  }
  if (href === "/organizer/settings/plan") {
    return pathname === "/organizer/settings/plan" || pathname.startsWith("/organizer/settings/plan/");
  }
  if (href === "/organizer/settings/payouts") {
    return pathname === "/organizer/settings/payouts" || pathname.startsWith("/organizer/settings/payouts/");
  }
  if (href === "/organizer/settings") {
    if (pathname.startsWith("/organizer/settings/plan")) return false;
    if (pathname.startsWith("/organizer/settings/payouts")) return false;
    return pathname === "/organizer/settings" || pathname.startsWith("/organizer/settings/");
  }
  return pathname === href || pathname.startsWith(href + "/");
}

export default function OrganizerSidebar({
  variant = "full",
  showAdminLink = false,
}: {
  variant?: OrganizerNavVariant;
  showAdminLink?: boolean;
}) {
  const pathname = usePathname();
  const navItems = variant === "lite" ? LITE_NAV_ITEMS : FULL_NAV_ITEMS;

  return (
    <aside className="hidden min-[900px]:sticky min-[900px]:top-[var(--mg-pc-top-nav-h)] min-[900px]:z-20 min-[900px]:flex min-[900px]:max-h-[calc(100dvh-var(--mg-pc-top-nav-h))] min-[900px]:w-[200px] min-[900px]:shrink-0 min-[900px]:self-start min-[900px]:flex-col min-[900px]:border-r min-[900px]:border-[#ccc4b4]">
      {/* Organizer brand block */}
      <div className="relative shrink-0 overflow-hidden rounded-b-[18px] bg-[#6f9562] px-[22px] py-[20px]">
        <svg
          className="absolute right-4 top-3 h-10 w-10 opacity-65"
          viewBox="0 0 48 48"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <circle cx="24" cy="24" r="17" fill="none" stroke="#8faa67" strokeWidth="1.5" />
          <circle cx="24" cy="24" r="11" fill="none" stroke="#8faa67" strokeWidth="1" />
          <path d="M24 7v34M7 24h34M12 12l24 24M36 12 12 36" stroke="#8faa67" strokeWidth="1" />
        </svg>

        <div className="relative z-10">
          <div
            className="whitespace-nowrap text-[14px] font-semibold text-[#f5fbf7]"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            MachiGlyph
          </div>
          <div className="mt-0.5 whitespace-nowrap text-[11px] tracking-[0.07em] text-[rgba(245,251,247,0.95)]">
            {variant === "lite" ? "主催者ページ" : "主催者管理"}
          </div>
        </div>
      </div>

      {/* Menu items */}
      <nav className="min-h-0 flex-1 overflow-y-auto bg-[#faf8f2]" aria-label="主催者メニュー">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center whitespace-nowrap border-b border-[#ece6dc] px-[14px] py-[10px] text-[13px] transition-colors",
                active
                  ? "border-l-2 border-l-[#1e3848] bg-[#eef6f2] font-medium text-[#1e3848]"
                  : "text-[#3a3428] hover:bg-[#f4f0e8]"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom links */}
      <div className="shrink-0 border-t border-[#c8dcd0] bg-[#f4faf6] p-3 space-y-1">
        {showAdminLink && (
          <Link
            href="/admin"
            className="flex items-center whitespace-nowrap rounded-lg px-3 py-2 text-[12px] font-medium transition"
            style={{ background: "#1e3848", color: "#70c8e0" }}
          >
            🔐 管理者画面
          </Link>
        )}
        <Link
          href="/"
          className="flex items-center whitespace-nowrap rounded-lg px-3 py-2 text-[13px] text-[#3a5848] transition hover:bg-[#ecf6ee] hover:text-[#1e3828]"
        >
          ← サイトへ戻る
        </Link>
      </div>
    </aside>
  );
}
