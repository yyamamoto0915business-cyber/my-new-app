type Props = {
  className?: string;
};

/** 参加パス空状態用 — チケット＋星＋QR＋葉・雲の装飾イラスト */
export function ParticipationPassEmptyIllustration({
  className = "h-[140px] w-[160px]",
}: Props) {
  return (
    <svg
      viewBox="0 0 200 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="参加パスのイラスト"
    >
      {/* 背景ブロブ */}
      <ellipse cx="100" cy="78" rx="78" ry="52" fill="#eef6f0" />

      {/* 雲 */}
      <ellipse cx="62" cy="36" rx="18" ry="9" fill="#dceee2" opacity="0.85" />
      <ellipse cx="78" cy="34" rx="12" ry="7" fill="#dceee2" opacity="0.85" />
      <ellipse cx="128" cy="32" rx="16" ry="8" fill="#dceee2" opacity="0.7" />

      {/* きらめき */}
      <path
        d="M42 42l1.8 4 4 1.8-4 1.8-1.8 4-1.8-4-4-1.8 4-1.8 1.8-4z"
        fill="#c8e070"
        opacity="0.9"
      />
      <path
        d="M158 48l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2 1.2-2.8z"
        fill="#c8e070"
        opacity="0.75"
      />
      <circle cx="168" cy="70" r="2" fill="#b8dcc8" />
      <circle cx="34" cy="68" r="1.5" fill="#b8dcc8" />

      {/* 葉（左） */}
      <path
        d="M30 86c-2-10 4-18 12-20-2 8-4 14-12 20z"
        fill="#b8dcc8"
      />
      <path
        d="M36 94c-6-6-6-16 0-22 0 8 2 16 0 22z"
        fill="#c8dece"
      />
      <path
        d="M44 98c-4-4-2-12 4-14-1 5-1 10-4 14z"
        fill="#b8dcc8"
        opacity="0.8"
      />

      {/* 葉（右） */}
      <path
        d="M170 88c2-10-4-18-12-20 2 8 4 14 12 20z"
        fill="#b8dcc8"
      />
      <path
        d="M164 96c6-6 6-16 0-22 0 8-2 16 0 22z"
        fill="#c8dece"
      />

      {/* チケット本体 */}
      <rect
        x="36"
        y="52"
        width="128"
        height="60"
        rx="12"
        fill="#ffffff"
        stroke="#6aab82"
        strokeWidth="2.25"
      />

      {/* 切り取り点線 */}
      <line
        x1="128"
        y1="56"
        x2="128"
        y2="108"
        stroke="#6aab82"
        strokeWidth="1.75"
        strokeDasharray="3.5 3.5"
      />

      {/* 半円切り込み（上下） */}
      <circle cx="128" cy="52" r="6" fill="#eef6f0" />
      <path
        d="M122 52a6 6 0 0 1 12 0"
        stroke="#6aab82"
        strokeWidth="2.25"
        fill="none"
      />
      <circle cx="128" cy="112" r="6" fill="#eef6f0" />
      <path
        d="M122 112a6 6 0 0 0 12 0"
        stroke="#6aab82"
        strokeWidth="2.25"
        fill="none"
      />

      {/* 星（左） */}
      <path
        d="M70 70l4.2 8.5 9.4 1.4-6.8 6.6 1.6 9.3-8.4-4.4-8.4 4.4 1.6-9.3-6.8-6.6 9.4-1.4 4.2-8.5z"
        fill="#4a9a68"
      />

      {/* QR簡略（右寄り・左セクション内） */}
      <g transform="translate(96 86)">
        <rect width="18" height="18" rx="2" fill="#dce8de" />
        <rect x="2" y="2" width="5" height="5" fill="#5a9a72" />
        <rect x="11" y="2" width="5" height="5" fill="#5a9a72" />
        <rect x="2" y="11" width="5" height="5" fill="#5a9a72" />
        <rect x="9" y="9" width="3" height="3" fill="#5a9a72" />
        <rect x="13" y="12" width="3" height="3" fill="#5a9a72" />
      </g>

      {/* スタブ側バーコード */}
      <rect x="138" y="68" width="2" height="28" rx="0.5" fill="#b8dcc8" />
      <rect x="142" y="68" width="3" height="28" rx="0.5" fill="#6aab82" opacity="0.7" />
      <rect x="147" y="68" width="2" height="28" rx="0.5" fill="#b8dcc8" />
      <rect x="151" y="68" width="2.5" height="28" rx="0.5" fill="#6aab82" opacity="0.55" />
      <rect x="140" y="100" width="14" height="2.5" rx="1" fill="#c8dece" />
    </svg>
  );
}
