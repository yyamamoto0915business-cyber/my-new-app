"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type OrganizerNavVariant = "full" | "lite";

const FULL_NAV_ITEMS = [
  { label: "ダッシュボード", href: "/organizer" },
  { label: "イベント管理", href: "/organizer/events" },
  { label: "主催者プラン（公開枠）", href: "/organizer/settings/plan" },
  { label: "売上受取（Stripe）", href: "/organizer/settings/payouts" },
  { label: "スタッフ募集管理", href: "/organizer/recruitments" },
  { label: "記事管理", href: "/organizer/articles" },
  { label: "ストーリー", href: "/organizer/stories" },
  { label: "受信箱", href: "/organizer/inbox" },
  { label: "設定", href: "/organizer/settings" },
] as const;

const LITE_NAV_ITEMS = [
  { label: "主催者登録をはじめる", href: "/organizer/register" },
  { label: "料金プランを見る", href: "/organizer/settings/plan" },
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

export default function OrganizerMobileNav({
  variant = "full",
}: {
  variant?: OrganizerNavVariant;
}) {
  const pathname = usePathname();
  const navItems = variant === "lite" ? LITE_NAV_ITEMS : FULL_NAV_ITEMS;

  return (
    <div className="md:hidden shrink-0">
      <Sheet>
        <SheetTrigger
          render={
            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-50/80 text-slate-700 shadow-[0_6px_16px_rgba(15,23,42,0.06)] transition-all duration-200 ease-out hover:bg-white active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mg-accent)]/30 focus-visible:ring-offset-2"
              aria-label="メニューを開く"
            >
              <Menu className="h-5 w-5" strokeWidth={2.2} aria-hidden />
            </button>
          }
        />

        <SheetContent
          side="left"
          className="flex w-72 flex-col border-slate-200/80 bg-white p-0 sm:max-w-[280px]"
          showCloseButton={true}
        >
          <div className="border-b border-slate-200/80 px-4 py-4">
            <div className="text-sm font-semibold text-slate-800">
              {variant === "lite" ? "主催者ページ" : "イベント運営メニュー"}
            </div>
            {variant === "lite" && (
              <div className="mt-1 text-xs text-slate-500">
                まずは主催者登録を完了しましょう
              </div>
            )}
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="主催者メニュー">
            {navItems.map((item) => {
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
