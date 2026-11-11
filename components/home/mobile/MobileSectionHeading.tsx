import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Props = {
  /** 上に小さく出す英字（例：THEME） */
  eyebrow: string;
  title: string;
  href?: string;
  linkLabel?: string;
};

/**
 * まちの情報（スマホ）の見出し。
 * 前のヒーローの「MACHI INFORMATION」と同じ小さな英字ラベルと、明朝体の見出しにそろえる。
 */
export function MobileSectionHeading({ eyebrow, title, href, linkLabel = "もっとみる" }: Props) {
  return (
    <div className="mb-2.5 flex items-end justify-between gap-2">
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-[9.5px] font-medium tracking-[0.24em] text-[#a08a68]">
          <span className="h-px w-4 bg-[#cbbba0]" aria-hidden />
          {eyebrow}
        </p>
        <h2
          className="mt-0.5 text-[18px] font-bold tracking-[0.04em] text-[#2a2218]"
          style={{ fontFamily: "var(--font-serif-display), 'Shippori Mincho', 'Noto Serif JP', serif" }}
        >
          {title}
        </h2>
      </div>
      {href ? (
        <Link
          href={href}
          className="mb-0.5 inline-flex shrink-0 items-center gap-0.5 text-[12px] font-semibold text-[#1f5e3a]"
        >
          {linkLabel}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}
