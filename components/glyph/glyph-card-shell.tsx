"use client";

type Props = {
  children: React.ReactNode;
  /** 追加のクラス名 */
  className?: string;
  /** 非アクティブ（終了など）のとき薄く表示 */
  dimmed?: boolean;
};

/**
 * カードの質感統一：薄い線＋柔らかい影＋余白。
 * 中身のロジックは一切変更せずラップするのみ。
 */
export function GlyphCardShell({
  children,
  className = "",
  dimmed = false,
}: Props) {
  return (
    <div
      className={`overflow-hidden rounded-xl border transition-opacity duration-200 mg-card-glow [border-color:var(--mg-line)] ${
        dimmed ? "opacity-60" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
