"use client";

/**
 * 軽量なグレイン（ノイズ）オーバーレイ。
 * CSS の repeating-conic-gradient で疑似ノイズを生成（外部画像なし）。
 * opacity 0.03〜0.06 で紙の質感を足す。
 */
export function GlyphGrainOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[-1] mix-blend-multiply dark:mix-blend-overlay"
      aria-hidden
      style={{
        backgroundImage: `repeating-conic-gradient(
          var(--mg-ink) 0% 0.25%,
          transparent 0% 0.5%
        )`,
        backgroundSize: "2px 2px",
        opacity: 0.04,
      }}
    />
  );
}
