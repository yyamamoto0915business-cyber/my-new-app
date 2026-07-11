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
      className="flex h-full min-h-0 min-w-0 flex-[9] basis-0 items-start justify-center overflow-y-auto bg-[#f3f4f1] px-8 pb-8 pt-8 xl:px-10 xl:pb-10 xl:pt-10"
      aria-label={isLogin ? "ログインフォーム" : "新規登録フォーム"}
    >
      <div
        className={cn(
          "w-full max-w-[380px] rounded-[24px] border border-[#e6ebe7] bg-white shadow-[0_14px_40px_rgba(30,56,40,0.07)]",
          isLogin ? "px-7 py-7 xl:px-8 xl:py-8" : "px-7 py-6 xl:px-8 xl:py-7"
        )}
      >
        <header className={cn("text-center", isLogin ? "mb-6" : "mb-4")}>
          <span className="inline-flex items-center rounded-full border border-[#cfe5d4] bg-[#edf6ef] px-3.5 py-1 text-[11px] font-medium tracking-[0.1em] text-[#3d5c48]">
            MachiGlyph
          </span>
          <h2
            className={cn(
              "font-semibold tracking-tight text-[#1e3828]",
              isLogin ? "mt-3.5 text-[26px]" : "mt-3 text-[22px]"
            )}
            style={{ fontFamily: "var(--font-serif-display)" }}
          >
            {isLogin ? "ログイン" : "はじめて利用する"}
          </h2>
          <p
            className={cn(
              "leading-relaxed text-[#5a7464]",
              isLogin ? "mt-2 text-[13px]" : "mt-1.5 text-[12px]"
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
