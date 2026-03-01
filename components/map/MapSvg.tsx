"use client";

/**
 * 宝の地図SVG：等高線・グリッド・コンパス・スポットラベル
 * viewBox 0 0 1200 800 で統一
 */
export function MapSvg() {
  return (
    <svg
      className="absolute inset-0 h-full w-full opacity-[0.065] dark:opacity-[0.05]"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1200 800"
      style={{ color: "var(--mg-ink)" }}
      aria-hidden
    >
      <defs>
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
      <rect width="100%" height="100%" fill="url(#glyph-contour)" />
      <rect width="100%" height="100%" fill="url(#glyph-grid)" opacity="0.5" />
      {/* コンパス */}
      <g transform="translate(950 550)" opacity="0.7">
        <circle r="65" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <circle r="45" fill="none" stroke="currentColor" strokeWidth="0.35" opacity="0.8" />
        <circle r="28" fill="none" stroke="currentColor" strokeWidth="0.3" opacity="0.6" />
      </g>
      {/* スポットラベル */}
      <g
        fill="currentColor"
        fontFamily="var(--font-serif), serif"
        fontSize="14"
        fontWeight="500"
        opacity="0.4"
        letterSpacing="0.1em"
      >
        <text x="180" y="175">HOME</text>
        <text x="920" y="355">VOLUNTEER</text>
        <text x="580" y="295">EVENTS</text>
        <text x="200" y="525">PROFILE</text>
        <text x="850" y="595">MESSAGES</text>
      </g>
    </svg>
  );
}
