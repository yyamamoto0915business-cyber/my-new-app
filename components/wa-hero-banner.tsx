/**
 * 和テイスト ヒーローバナー（全ページ共通）
 * 萌黄グリーングラデーション + SVG和柄（青海波・山・日輪・家紋）
 */

type Props = {
  /** 上部の小ラベル（英語装飾テキスト） */
  eyebrow?: string;
  /** メインタイトル */
  title: string;
  /** サブタイトル */
  subtitle?: string;
  /** バナー高さ (px)。デフォルト 190 */
  height?: number;
  /** 追加クラス */
  className?: string;
};

export function WaHeroBanner({
  eyebrow,
  title,
  subtitle,
  height = 190,
  className = "",
}: Props) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ height }}
      aria-hidden="true"
    >
      {/* グラデーション背景 */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(135deg, #dde8db 0%, #e4ede0 100%)" }}
      />

      {/* SVG 和柄レイヤー */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 400 190"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern
            id="wa-seigaiha"
            x="0"
            y="0"
            width="24"
            height="16"
            patternUnits="userSpaceOnUse"
          >
            <path d="M0 16 A12 12 0 0 1 24 16" fill="none" stroke="#9ab49a" strokeWidth="1" />
            <path d="M-12 16 A12 12 0 0 1 12 16" fill="none" stroke="#9ab49a" strokeWidth="1" />
          </pattern>
        </defs>
        {/* 青海波 */}
        <rect width="400" height="190" fill="url(#wa-seigaiha)" opacity="0.5" />
        {/* 山のシルエット layer 1 */}
        <path
          d="M0 190 L50 140 L100 155 L150 108 L200 145 L250 116 L300 148 L350 124 L400 155 L400 190 Z"
          fill="#a8c8a4"
          opacity="0.55"
        />
        {/* 山のシルエット layer 2 */}
        <path
          d="M0 190 L40 162 L85 170 L128 150 L168 163 L212 150 L258 164 L296 153 L342 165 L400 158 L400 190 Z"
          fill="#98b894"
          opacity="0.65"
        />
        {/* 日輪 top-right */}
        <g opacity="0.22">
          <circle cx="380" cy="22" r="28" fill="none" stroke="white" strokeWidth="0.7" />
          <circle cx="380" cy="22" r="42" fill="none" stroke="white" strokeWidth="0.5" />
          <circle cx="380" cy="22" r="56" fill="none" stroke="white" strokeWidth="0.4" />
        </g>
        {/* 家紋風円紋 top-left */}
        <g transform="translate(30,30)" stroke="#607860" fill="none" opacity="0.3">
          <circle cx="0" cy="0" r="18" strokeWidth="1" />
          <line x1="-18" y1="0" x2="18" y2="0" strokeWidth="0.5" />
          <line x1="0" y1="-18" x2="0" y2="18" strokeWidth="0.5" />
          <line x1="-12.7" y1="-12.7" x2="12.7" y2="12.7" strokeWidth="0.5" />
          <line x1="12.7" y1="-12.7" x2="-12.7" y2="12.7" strokeWidth="0.5" />
        </g>
      </svg>

      {/* テキスト */}
      <div className="absolute bottom-5 left-5">
        {eyebrow && (
          <p className="text-[10px] font-medium tracking-[0.22em] text-[#607860]">{eyebrow}</p>
        )}
        <h1
          className="mt-0.5 font-serif text-[22px] font-bold leading-tight text-[#1e3020]"
          style={{ fontFamily: "'Shippori Mincho', 'Noto Serif JP', serif" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-[12px] text-[#4a5e4a]">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
