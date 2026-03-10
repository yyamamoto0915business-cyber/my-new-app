"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  Users,
  BookOpen,
  Settings,
  Inbox,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "ダッシュボード", href: "/organizer", icon: LayoutDashboard },
  { label: "イベント管理", href: "/organizer/events", icon: CalendarDays },
  { label: "募集管理", href: "/organizer/recruitments", icon: Users },
  { label: "記事管理", href: "/organizer/articles", icon: FileText },
  { label: "ストーリー", href: "/organizer/stories", icon: BookOpen },
  { label: "設定", href: "/organizer/settings", icon: Settings },
  { label: "インボックス", href: "/organizer/inbox", icon: Inbox },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/organizer") {
    return pathname === "/organizer" || pathname === "/organizer/";
  }
  if (href === "/organizer/events") {
    return pathname === "/organizer/events" || pathname === "/organizer/events/";
  }
  return pathname === href || pathname.startsWith(href + "/");
}

export default function OrganizerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-slate-200/80 md:bg-white">
      <div className="px-4 py-4">
        <div className="text-sm font-semibold text-slate-800">主催者管理</div>
        <div className="mt-1 text-xs text-slate-500">イベント運営メニュー</div>
      </div>

      <nav className="flex-1 space-y-1 px-3 pb-4" aria-label="主催者メニュー">
        {NAV_ITEMS.map((item) => {
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
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
          <span>サイトを見る</span>
        </Link>
      </div>
    </aside>
  );
}
