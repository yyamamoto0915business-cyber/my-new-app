import type { ReactNode } from "react";

/**
 * 主催者モードの色（深い緑＋金色の差し色）。
 * 利用者側（水彩のやわらかい色）と見分けやすく、落ち着いた「運営の道具」の印象にする。
 * 金色はイベントポイントのボタンと同じ系統。
 */
export const ORG_COLORS = {
  /** 深い緑（数字のカード・強調） */
  deep: "#173f2c",
  deeper: "#0e2a1d",
  /** 金色（細い線・英字ラベル・飾り） */
  gold: "#c9a54e",
  goldSoft: "#ecdcab",
  /** 白地の上で読める金色の文字 */
  goldText: "#a3812f",
} as const;

export const ORG_SERIF = "var(--font-serif-display), 'Shippori Mincho', 'Noto Serif JP', serif";

/** 深い緑の上にうっすら重ねる金色の菱形の模様 */
export const ORG_GOLD_PATTERN = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><path d='M12 1 L23 12 L12 23 L1 12 Z' fill='none' stroke='#c9a54e' stroke-width='0.7' opacity='0.35'/></svg>"
)}")`;

/** 見出しの上の小さな英字ラベル（金色の細い線つき） */
export function OrgEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-[9.5px] font-semibold tracking-[0.24em] text-[#a3812f]">
      <span className="h-px w-4 bg-gradient-to-r from-[#c9a54e] to-[#ecdcab]" aria-hidden />
      {children}
    </p>
  );
}
