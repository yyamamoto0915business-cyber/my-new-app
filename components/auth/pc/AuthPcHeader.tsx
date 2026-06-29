"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";

type Props = {
  onSignupClick?: () => void;
};

export function AuthPcHeader({ onSignupClick }: Props) {
  return (
    <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-[#e8ebe6] bg-white/95 px-8 backdrop-blur-sm">
      <Link
        href="/"
        className="flex items-center gap-2.5"
        aria-label="MachiGlyph ホームへ"
      >
        <Image
          src="/auth/brand-mark.png"
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 shrink-0"
        />
        <span
          className="text-[18px] font-semibold tracking-[0.02em] text-[#1e3828]"
          style={{ fontFamily: "var(--font-serif-display)" }}
        >
          MachiGlyph
        </span>
      </Link>

      <nav className="flex items-center gap-3" aria-label="認証ページナビゲーション">
        <Link
          href="/stories"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium text-[#3d5c48] transition-colors hover:bg-[#f4f6f4] hover:text-[#1e3828]"
        >
          <BookOpen className="h-4 w-4 text-[#6a9080]" aria-hidden />
          ストーリーを見る
        </Link>
        <Link
          href="/auth?tab=signup"
          onClick={(e) => {
            if (onSignupClick) {
              e.preventDefault();
              onSignupClick();
            }
          }}
          className="inline-flex h-9 items-center rounded-full border border-[#c8dcd0] bg-white px-4 text-[13px] font-medium text-[#1e3828] shadow-sm transition-colors hover:bg-[#f8faf8]"
        >
          新規登録
        </Link>
      </nav>
    </header>
  );
}
