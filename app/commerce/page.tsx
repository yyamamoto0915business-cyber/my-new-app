import type { Metadata } from "next";
import Link from "next/link";
import {
  COMMERCE_TITLE,
  COMMERCE_INTRO,
  COMMERCE_ITEMS,
  LEGAL_DATES,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: `${COMMERCE_TITLE} - MachiGlyph`,
  description: "MachiGlyphの特定商取引法に基づく表記",
};

export default function CommercePage() {
  return (
    <div className="min-h-screen bg-[var(--mg-paper)]">
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <h1 className="font-serif text-2xl font-bold tracking-tight text-[var(--mg-ink)] sm:text-3xl">
          {COMMERCE_TITLE}
        </h1>
        <p className="mt-3 text-sm text-[var(--mg-muted)]">
          制定日：{LEGAL_DATES.established}　改定日：{LEGAL_DATES.revised}
        </p>
        <p className="mt-6 text-sm leading-relaxed text-[var(--mg-ink)]/90">
          {COMMERCE_INTRO}
        </p>

        {/* テーブル */}
        <div className="mt-10 overflow-hidden rounded-xl border border-[var(--mg-line)]">
          <table className="w-full text-sm">
            <tbody>
              {COMMERCE_ITEMS.map((item, i) => (
                <tr
                  key={item.label}
                  className={
                    i < COMMERCE_ITEMS.length - 1
                      ? "border-b border-[var(--mg-line)]"
                      : ""
                  }
                >
                  <th className="w-[130px] bg-[var(--mg-paper)] px-4 py-4 text-left align-top font-medium text-[var(--mg-ink)] sm:w-[200px] sm:px-6">
                    {item.label}
                  </th>
                  <td className="whitespace-pre-line bg-white px-4 py-4 leading-[1.8] text-[var(--mg-ink)]/90 sm:px-6 sm:text-[15px]">
                    {item.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 関連リンク */}
        <div className="mt-12 border-t border-[var(--mg-line)] pt-6">
          <div className="flex flex-wrap gap-4 text-sm">
            <Link
              href="/terms"
              className="text-[var(--mg-muted)] underline-offset-2 hover:text-[var(--mg-accent)] hover:underline"
            >
              利用規約
            </Link>
            <Link
              href="/privacy"
              className="text-[var(--mg-muted)] underline-offset-2 hover:text-[var(--mg-accent)] hover:underline"
            >
              プライバシーポリシー
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
