"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  isLogin: boolean;
  children: ReactNode;
};

export function AuthPcFormShell({ isLogin, children }: Props) {
  return (
    <section
      className="flex h-full min-h-0 min-w-0 flex-[9] basis-0 items-center justify-center overflow-y-auto bg-[#f3f4f1] px-8 py-6 xl:px-10 xl:py-8"
      aria-label={isLogin ? "ログインフォーム" : "新規登録フォーム"}
    >
      <div
        className={cn(
          "w-full max-w-[392px] -translate-y-6 rounded-[26px] border border-[#e6ebe7] bg-white shadow-[0_16px_48px_rgba(30,56,40,0.08)] xl:-translate-y-8",
          isLogin ? "px-8 py-9 xl:py-10" : "px-7 py-7 xl:px-8 xl:py-8"
        )}
      >
        <header className={cn("text-center", isLogin ? "mb-7" : "mb-5")}>
          <span className="inline-flex items-center rounded-full border border-[#cfe5d4] bg-[#edf6ef] px-4 py-1 text-[11px] font-medium tracking-[0.1em] text-[#3d5c48]">
            MachiGlyph
          </span>
          <h2
            className={cn(
              "font-semibold tracking-tight text-[#1e3828]",
              isLogin ? "mt-4 text-[28px]" : "mt-3 text-[24px]"
            )}
            style={{ fontFamily: "var(--font-serif-display)" }}
          >
            {isLogin ? "ログイン" : "はじめて利用する"}
          </h2>
          <p
            className={cn(
              "leading-relaxed text-[#5a7464]",
              isLogin ? "mt-2.5 text-[13px]" : "mt-2 text-[12px]"
            )}
          >
            {isLogin
              ? "続きから、地域のイベントや活動を見つけられます"
              : "イベント参加も、活動の主催も、ここから始められます"}
          </p>
        </header>
        {children}
      </div>
    </section>
  );
}
