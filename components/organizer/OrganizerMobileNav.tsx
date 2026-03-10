"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "ダッシュボード", href: "/organizer" },
  { label: "イベント管理", href: "/organizer/events" },
  { label: "募集管理", href: "/organizer/recruitments" },
  { label: "記事管理", href: "/organizer/articles" },
  { label: "ストーリー", href: "/organizer/stories" },
  { label: "設定", href: "/organizer/settings" },
  { label: "インボックス", href: "/organizer/inbox" },
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

export default function OrganizerMobileNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden shrink-0">
      <Sheet>
        <SheetTrigger
          render={
            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              aria-label="メニューを開く"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
          }
        />

        <SheetContent
          side="left"
          className="flex w-72 flex-col border-slate-200/80 bg-white p-0 sm:max-w-[280px]"
          showCloseButton={true}
        >
          <div className="border-b border-slate-200/80 px-4 py-4">
            <div className="text-sm font-semibold text-slate-800">主催者管理</div>
            <div className="mt-1 text-xs text-slate-500">イベント運営メニュー</div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="主催者メニュー">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block rounded-xl px-3 py-2.5 text-sm transition",
                    active
                      ? "bg-slate-100 font-medium text-slate-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-200/80 p-3">
            <Link
              href="/"
              className="block rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              サイトを見る
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
