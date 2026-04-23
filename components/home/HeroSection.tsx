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
      className="rounded-[24px] border border-slate-200/90 bg-white/95 px-5 py-5 shadow-[0_4px_14px_rgba(15,23,42,0.05)] sm:px-8 sm:py-7 md:flex md:items-start md:justify-between md:gap-10"
      aria-label="MachiGlyphのご紹介"
    >
      <div className="flex-1 min-w-0">
        {/* ラベル（モバイルでは控えめに） */}
        <p className="text-[11px] font-medium tracking-wider text-slate-500 uppercase sm:text-xs">
          MachiGlyph
        </p>

        {/* メインコピー：主導線をシンプルに訴求 */}
        <h2 className="mt-2 font-serif text-xl font-semibold leading-snug text-slate-900 sm:text-2xl">
          まちのイベントと、出会える場所
        </h2>

        {/* 補足文はモバイルでは少し控えめに表示 */}
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600 sm:mt-2">
          近くで開かれる身近な催しや活動を、見つけられます。
        </p>

        {/* 検索導線：横幅いっぱい・角丸大きめ・余白広め */}
        <Link
          href="/events"
          className="mt-4 flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-left transition-colors hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
          aria-label="地域やイベント名で探す"
        >
          <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
          <span className="text-sm text-slate-700/90">
            地域やイベント名で探す
          </span>
        </Link>

        {/* 主導線：イベントを探す（ボタンを1つに絞る） */}
        <div className="mt-4 flex flex-col gap-3 sm:mt-5 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href="/events"
            className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-6 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98] sm:w-auto"
          >
            <CalendarDays className="h-4 w-4 shrink-0" />
            イベントを探す
          </Link>

          {/* サブ導線：主催者・募集は小さめテキストリンクに */}
          <div className="flex w-full flex-col gap-1 text-xs text-slate-600 sm:flex-row sm:w-auto sm:items-center sm:gap-4 sm:text-sm">
            <Link
              href="/organizers"
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline sm:px-0 sm:text-sm"
            >
              <Users className="h-3.5 w-3.5 shrink-0" />
              主催者を見る
            </Link>
            <Link
              href="/recruitments"
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline sm:px-0 sm:text-sm"
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
