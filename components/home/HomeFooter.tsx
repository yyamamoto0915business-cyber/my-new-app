"use client";

import Link from "next/link";
import { CalendarDays, Users, Megaphone } from "lucide-react";

/** トップページ下部：MachiGlyphの案内と3軸への再導線 */
export function HomeFooter() {
  return (
    <footer
      className="rounded-2xl border border-slate-200/80 bg-slate-50/50 px-6 py-8 sm:px-8"
      aria-label="MachiGlyphについて"
    >
      <p className="text-center text-sm leading-relaxed text-slate-600">
        地域のイベントを探したり、主催者とつながったり、参加やお手伝いの募集に応募したり。
        <br className="hidden sm:inline" />
        MachiGlyphで、地域とのつながりをもっと身近に。
      </p>
      <nav
        className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6"
        aria-label="トップページへ戻る"
      >
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <CalendarDays className="h-4 w-4" />
          イベントを探す
        </Link>
        <Link
          href="/organizers"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <Users className="h-4 w-4" />
          主催者を見る
        </Link>
        <Link
          href="/recruitments"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <Megaphone className="h-4 w-4" />
          募集を見る
        </Link>
      </nav>
    </footer>
  );
}
