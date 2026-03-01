"use client";

/**
 * 宝の地図を背景に敷く。
 * 等高線・グリッド・コンパスで古地図の雰囲気を出し、足あと（点列）が映える土台にする。
 * 重い画像は使わず SVG のみ。
 */
export function GlyphBackgroundMap() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[-2] overflow-hidden"
      aria-hidden
    >
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,var(--mg-paper)_0%,color-mix(in_srgb,var(--mg-paper)_95%,#ebe8e2)_100%)] dark:bg-[linear-gradient(180deg,var(--mg-paper)_0%,color-mix(in_srgb,var(--mg-paper)_95%,#1a1a18)_100%)]"
        aria-hidden
      />
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.065] dark:opacity-[0.05]"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 800"
        style={{ color: "var(--mg-ink)" }}
      >
        <defs>
          {/* 等高線（地形図風・やや粗め） */}
          <pattern
            id="glyph-contour"
            x="0"
            y="0"
            width="280"
            height="280"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 140 Q70 110 140 140 T280 140 M0 70 Q70 40 140 70 T280 70 M0 210 Q70 180 140 210 T280 210"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.6"
            />
            <path
              d="M140 0 Q110 70 140 140 T140 280 M70 0 Q40 70 70 140 T70 280 M210 0 Q180 70 210 140 T210 280"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.6"
            />
          </pattern>
          {/* 地図グリッド（経緯度風・控えめ） */}
          <pattern
            id="glyph-grid"
            x="0"
            y="0"
            width="110"
            height="110"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 110 0 L 0 0 0 110"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.25"
              opacity="0.7"
            />
          </pattern>
        </defs>
        {/* 等高線：主役レイヤー */}
        <rect width="100%" height="100%" fill="url(#glyph-contour)" />
        {/* グリッド：控えめ */}
        <rect width="100%" height="100%" fill="url(#glyph-grid)" opacity="0.5" />
        {/* コンパス：右下に1つだけ（古地図の羅針図） */}
        <g
          transform="translate(950 550)"
          opacity="0.7"
          style={{ color: "var(--mg-ink)" }}
        >
          <circle r="65" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <circle r="45" fill="none" stroke="currentColor" strokeWidth="0.35" opacity="0.8" />
          <circle r="28" fill="none" stroke="currentColor" strokeWidth="0.3" opacity="0.6" />
        </g>
      </svg>
    </div>
  );
}
