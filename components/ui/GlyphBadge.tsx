"use client";

type GlyphId = "free" | "kids" | "workshop" | "night" | "walkable";

const GLYPH_LABELS: Record<GlyphId, string> = {
  free: "無料",
  kids: "親子",
  workshop: "体験",
  night: "夜",
  walkable: "徒歩圏",
};

type Props = {
  glyph: GlyphId;
  className?: string;
};

/** スタンプ風グリフバッジ（丸み＋半透明） */
export function GlyphBadge({ glyph, className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-white/90 backdrop-blur-sm border border-white/60 shadow-sm text-zinc-700 dark:bg-zinc-800/90 dark:border-zinc-700/60 dark:text-zinc-300 ${className}`}
    >
      {GLYPH_LABELS[glyph] ?? glyph}
    </span>
  );
}

export type { GlyphId };
