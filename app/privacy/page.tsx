import type { Metadata } from "next";
import Link from "next/link";
import {
  PRIVACY_TITLE,
  PRIVACY_INTRO,
  PRIVACY_SECTIONS,
  LEGAL_DATES,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: `${PRIVACY_TITLE} - MachiGlyph`,
  description: "MachiGlyphのプライバシーポリシー",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--mg-paper)]">
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <h1 className="font-serif text-2xl font-bold tracking-tight text-[var(--mg-ink)] sm:text-3xl">
          {PRIVACY_TITLE}
        </h1>
        <p className="mt-3 text-sm text-[var(--mg-muted)]">
          制定日：{LEGAL_DATES.established}　改定日：{LEGAL_DATES.revised}
        </p>

        {/* 導入文 */}
        <p className="mt-8 text-sm leading-[1.9] text-[var(--mg-ink)]/90">
          {PRIVACY_INTRO}
        </p>

        {/* 目次 */}
        <nav className="mt-8 rounded-xl border border-[var(--mg-line)] bg-white/60 p-4 sm:p-5">
          <p className="mb-2 text-xs font-medium text-[var(--mg-muted)]">
            目次
          </p>
          <ul className="space-y-1">
            {PRIVACY_SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-sm text-[var(--mg-ink)] underline-offset-2 hover:text-[var(--mg-accent)] hover:underline"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* 本文 */}
        <div className="mt-10 space-y-10">
          {PRIVACY_SECTIONS.map((s) => (
            <section key={s.id} id={s.id}>
              <h2 className="border-b border-[var(--mg-line)] pb-2 font-serif text-lg font-semibold text-[var(--mg-ink)] sm:text-xl">
                {s.title}
              </h2>
              <div className="mt-4 whitespace-pre-line text-sm leading-[1.9] text-[var(--mg-ink)]/90 sm:text-[15px]">
                {s.body}
              </div>
            </section>
          ))}
        </div>

        {/* 末尾日付 */}
        <div className="mt-12 space-y-1 text-sm text-[var(--mg-muted)]">
          <p>制定日：{LEGAL_DATES.established}</p>
          <p>改定日：{LEGAL_DATES.revised}</p>
        </div>

        {/* 関連リンク */}
        <div className="mt-8 border-t border-[var(--mg-line)] pt-6">
          <div className="flex flex-wrap gap-4 text-sm">
            <Link
              href="/terms"
              className="text-[var(--mg-muted)] underline-offset-2 hover:text-[var(--mg-accent)] hover:underline"
            >
              利用規約
            </Link>
            <Link
              href="/commerce"
              className="text-[var(--mg-muted)] underline-offset-2 hover:text-[var(--mg-accent)] hover:underline"
            >
              特定商取引法に基づく表記
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
