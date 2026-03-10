"use client";

import Link from "next/link";
import { CalendarDays, Users, Megaphone } from "lucide-react";

/** 3軸の入り口：イベント・主催者・募集 */
export function HomeQuickNav() {
  return (
    <nav
      className="flex gap-2 sm:gap-3"
      aria-label="MachiGlyphの主な機能"
    >
      <Link
        href="/events"
        className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-slate-500" />
        <span>イベントを探す</span>
      </Link>
      <Link
        href="/organizers"
        className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
      >
        <Users className="h-4 w-4 shrink-0 text-slate-500" />
        <span>主催者を見る</span>
      </Link>
      <Link
        href="/recruitments"
        className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
      >
        <Megaphone className="h-4 w-4 shrink-0 text-slate-500" />
        <span>募集を見る</span>
      </Link>
    </nav>
  );
}
