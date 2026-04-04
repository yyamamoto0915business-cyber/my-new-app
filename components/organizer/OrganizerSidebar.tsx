"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  ExternalLink,
  FileText,
  Inbox,
  Layers,
  Landmark,
  LayoutDashboard,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type OrganizerNavVariant = "full" | "lite";

const FULL_NAV_ITEMS = [
  { label: "ダッシュボード", href: "/organizer", icon: LayoutDashboard },
  { label: "イベント管理", href: "/organizer/events", icon: CalendarDays },
  { label: "主催者プラン（公開枠）", href: "/organizer/settings/plan", icon: Layers },
  { label: "売上受取（Stripe）", href: "/organizer/settings/payouts", icon: Landmark },
  { label: "スタッフ募集管理", href: "/organizer/recruitments", icon: Users },
  { label: "記事管理", href: "/organizer/articles", icon: FileText },
  { label: "ストーリー", href: "/organizer/stories", icon: BookOpen },
  { label: "受信箱", href: "/organizer/inbox", icon: Inbox },
  { label: "設定", href: "/organizer/settings", icon: Settings },
] as const;

const LITE_NAV_ITEMS = [
  { label: "活動者登録をはじめる", href: "/organizer/register", icon: UserPlus },
  { label: "料金プランを見る", href: "/organizer/settings/plan", icon: Layers },
  { label: "イベントを探す", href: "/events", icon: ExternalLink },
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
    return (
      pathname === "/organizer/settings/payouts" || pathname.startsWith("/organizer/settings/payouts/")
    );
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
}: {
  variant?: OrganizerNavVariant;
}) {
  const pathname = usePathname();
  const navItems = variant === "lite" ? LITE_NAV_ITEMS : FULL_NAV_ITEMS;

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-slate-200/80 md:bg-white">
      <div className="px-4 py-4">
        <div className="text-sm font-semibold text-slate-800">
          {variant === "lite" ? "主催者ページ" : "イベント運営メニュー"}
        </div>
        {variant === "lite" && (
          <div className="mt-1 text-xs text-slate-500">
            まずは主催者登録を完了しましょう
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 pb-4" aria-label="主催者メニュー">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                active
                  ? "bg-slate-100 font-medium text-slate-900"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200/80 p-3">
        {variant === "full" && (
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
            <span>サイトを見る</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
