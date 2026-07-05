"use client";

import type { ReactNode } from "react";
import { Leaf, Sprout, UserRound } from "lucide-react";
import { Caveat } from "next/font/google";
import { cn } from "@/lib/utils";

const welcomeFont = Caveat({
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

/** 左の丸アイコン幅 (44px) + gap (10px) — ラベルを入力ボックス左端に揃える */
const FIELD_ICON_OFFSET = "pl-[54px]";
/** 新規登録コンパクト時（40px アイコン + gap 8px） */
const FIELD_ICON_OFFSET_COMPACT = "pl-[48px]";

export { FIELD_ICON_OFFSET, FIELD_ICON_OFFSET_COMPACT };

type Tab = "login" | "signup";

type Props = {
  tab: Tab;
  switchTab: (tab: Tab) => void;
  children: ReactNode;
};

/** 固定下部ナビ分の余白（ナビ高さ + 余白 + safe-area） */
const MOBILE_BOTTOM_CLEARANCE =
  "calc(80px + 2.75rem + env(safe-area-inset-bottom, 0px))";

/** カード上端をイラストの地平線付近に合わせる（上19%が風景） */
const HERO_SPACER_CLASS =
  "h-[clamp(1.25rem,calc(19*100vw*1024/576/100-var(--mg-mobile-top-header-h,118px)),3.5rem)]";

export function AuthMobileFormShell({ tab, switchTab, children }: Props) {
  const isLogin = tab === "login";

  return (
    <section
      className="relative z-10 w-full px-3 pt-0"
      style={{ paddingBottom: MOBILE_BOTTOM_CLEARANCE }}
      aria-label={isLogin ? "ログインフォーム" : "新規登録フォーム"}
    >
      <div className="mx-auto w-full max-w-[400px]">
        <div className={HERO_SPACER_CLASS} aria-hidden />

        {/* モックアップ準拠：背景が透ける半透明カード（入力欄はその上に白で配置） */}
        <div
          className={cn(
            "rounded-[28px] border border-white/70 bg-white/[0.74] shadow-[0_4px_24px_rgba(42,85,64,0.08)] backdrop-blur-[10px]",
            isLogin ? "px-4 py-5" : "px-3.5 py-3.5"
          )}
        >
          <header className="text-left">
            <p
              className={cn(
                "ml-1 inline-flex items-center gap-1 font-semibold leading-none text-[#6a9a78]",
                isLogin ? "text-[30px]" : "text-[26px]",
                welcomeFont.className
              )}
            >
              Welcome!
              <Leaf className="h-3.5 w-3.5 rotate-[-15deg] text-[#8fbc8f]" aria-hidden />
            </p>
            <h1
              className={cn(
                "mt-1 font-bold tracking-tight text-[#1e3828]",
                isLogin ? "text-[26px]" : "text-[22px]"
              )}
            >
              {isLogin ? "ログイン" : "はじめて利用する"}
            </h1>
            <p
              className={cn(
                "mt-1 leading-snug text-[#5a7464]",
                isLogin ? "text-[13px]" : "text-[12px] leading-tight"
              )}
            >
              {isLogin
                ? "続きから、地域のイベントや活動を見つけられます"
                : "イベント参加も、活動の主催も、ここから始められます"}
            </p>
          </header>

          <div className={cn("rounded-full border border-[#d4e0d8] bg-white p-1 shadow-sm", isLogin ? "mt-4" : "mt-3")}>
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => switchTab("login")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-full font-semibold transition-colors",
                  isLogin ? "h-10 text-[13px]" : "h-9 text-[12px]",
                  isLogin
                    ? "bg-gradient-to-r from-[#2a5540] via-[#315f48] to-[#3a6b50] text-white shadow-sm"
                    : "bg-white text-[#5a7464] hover:text-[#1e3828]"
                )}
              >
                <UserRound className="h-3.5 w-3.5 shrink-0" aria-hidden />
                ログイン
              </button>
              <button
                type="button"
                onClick={() => switchTab("signup")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-full font-semibold transition-colors",
                  isLogin ? "h-10 text-[13px]" : "h-9 text-[12px]",
                  !isLogin
                    ? "bg-gradient-to-r from-[#2a5540] via-[#315f48] to-[#3a6b50] text-white shadow-sm"
                    : "bg-white text-[#5a7464] hover:text-[#1e3828]"
                )}
              >
                <Sprout className="h-3.5 w-3.5 shrink-0" aria-hidden />
                はじめて利用する
              </button>
            </div>
          </div>

          <div className={isLogin ? "mt-4" : "mt-3"}>{children}</div>
        </div>
      </div>
    </section>
  );
}
