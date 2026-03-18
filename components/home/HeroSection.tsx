"use client";

import Link from "next/link";
import { Search, CalendarDays, Users, Megaphone } from "lucide-react";
import { RegionFilter } from "@/components/region-filter";

/** ファーストビュー：コピー + 検索 + 3導線 + 地域補助 */
export function HeroSection() {
  const heroCategoryTags = [
    { label: "無料", tags: "free" },
    { label: "親子", tags: "kids" },
    { label: "体験", tags: "beginner" },
    { label: "交流会", tags: "indoor" },
  ];

  return (
    <section
      className="rounded-2xl border border-slate-200/60 bg-white px-5 py-6 shadow-sm sm:px-8 sm:py-8 md:flex md:items-start md:justify-between md:gap-10"
      aria-label="MachiGlyphのご紹介"
    >
      <div className="flex-1 min-w-0">
        {/* ラベル */}
        <p className="text-xs font-medium tracking-wider text-slate-500 uppercase">
          MachiGlyph
        </p>

        {/* メインコピー（2行以内） */}
        <h2 className="mt-2 max-w-xs font-serif text-xl font-semibold leading-snug text-slate-900 sm:text-2xl">
          まちのイベントと、
          <br className="sm:hidden" />
          出会える場所
        </h2>

        {/* 補足文（短め） */}
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          近くで開かれる催しや活動を、やさしく見つけられます。
        </p>

        {/* 検索導線（主導線の一部としてタップしやすく） */}
        <Link
          href="/events"
          className="mt-5 flex min-h-[52px] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/90 px-4 text-left transition-colors hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
        >
          <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
          <span className="text-sm text-slate-500">
            イベント名・地域・キーワードで探す
          </span>
        </Link>

        {/* 主導線：イベントを探す */}
        <div className="mt-4 flex flex-col gap-3 sm:mt-5 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href="/events"
            className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-6 text-sm font-medium text-white shadow-sm transition hover:opacity-90 active:scale-[0.98] sm:w-auto"
          >
            <CalendarDays className="h-4 w-4 shrink-0" />
            イベントを探す
          </Link>
          <div className="flex w-full justify-between gap-2 text-xs text-slate-600 sm:w-auto sm:items-center sm:gap-4 sm:text-sm">
            <Link
              href="/organizers"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 font-medium transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Users className="h-3.5 w-3.5 shrink-0" />
              主催者を見る
            </Link>
            <Link
              href="/recruitments"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 font-medium transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Megaphone className="h-3.5 w-3.5 shrink-0" />
              募集を見る
            </Link>
          </div>
        </div>

        {/* 地域・カテゴリ補助
            - スマホではファーストビューを軽くするため非表示
            - 少し下のセクションで再掲する */}
        <div className="mt-6 hidden space-y-4 sm:block">
          <p className="text-xs font-medium text-slate-500">地域で探す</p>
          <RegionFilter variant="chips" className="min-w-0" />

          <p className="mt-5 text-xs font-medium text-slate-500">
            カテゴリから探す
          </p>
          <div className="flex flex-wrap gap-2">
            {heroCategoryTags.map(({ label, tags }) => (
              <Link
                key={tags}
                href={`/events?tags=${tags}`}
                className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* PC時：右側に余白または将来的なビジュアル用 */}
      <div className="hidden md:block md:w-48 md:shrink-0" aria-hidden />
    </section>
  );
}
