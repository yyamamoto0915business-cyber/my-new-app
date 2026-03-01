"use client";

type Props = {
  /** 追加のクラス名 */
  className?: string;
  /** 点の数（デフォルト8） */
  count?: number;
};

/**
 * 点列ディバイダー。先頭1点だけアクセント（道の始まり）。
 * 墨の足あとのイメージ。
 */
export function GlyphDividerDots({ className = "", count = 8 }: Props) {
  return (
    <div
      className={`flex items-center gap-1.5 ${className}`}
      role="presentation"
      aria-hidden
    >
      {/* 先頭の1点：アクセント色 */}
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: "var(--mg-accent)" }}
      />
      {/* 続く点：薄墨色 */}
      {Array.from({ length: count - 1 }).map((_, i) => (
        <span
          key={i}
          className="h-1 w-1 shrink-0 rounded-full opacity-70"
          style={{ backgroundColor: "var(--mg-muted)" }}
        />
      ))}
    </div>
  );
}
