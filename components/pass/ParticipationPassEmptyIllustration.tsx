type Props = {
  className?: string;
};

/** 参加パス空状態用 — 星付きチケットイラスト（SVG） */
export function ParticipationPassEmptyIllustration({ className = "h-[140px] w-[140px]" }: Props) {
  return (
    <svg
      viewBox="0 0 160 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="参加パスのイラスト"
    >
      {/* 背景グロー */}
      <ellipse cx="80" cy="72" rx="62" ry="48" fill="#eef6f0" />

      {/* 装飾：きらめき */}
      <path
        d="M38 28l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5 1.5-3.5z"
        fill="#b8dcc8"
        opacity="0.7"
      />
      <path
        d="M124 32l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5z"
        fill="#b8dcc8"
        opacity="0.6"
      />
      <circle cx="132" cy="58" r="2" fill="#c8dece" />
      <circle cx="28" cy="62" r="1.5" fill="#c8dece" />

      {/* 葉っぱ（左） */}
      <path
        d="M34 88c-4-6-2-14 4-16 2 6 0 12-4 16z"
        fill="#c8dece"
        opacity="0.8"
      />
      <path
        d="M126 90c4-5 3-12-2-14-1 5 1 10 2 14z"
        fill="#c8dece"
        opacity="0.8"
      />

      {/* チケット本体 */}
      <rect x="28" y="44" width="104" height="56" rx="10" fill="#f7fbf8" stroke="#6aab82" strokeWidth="2" />

      {/* 切り取り線 */}
      <line x1="108" y1="48" x2="108" y2="96" stroke="#6aab82" strokeWidth="1.5" strokeDasharray="3 3" />

      {/* 半円切り込み */}
      <circle cx="108" cy="44" r="5" fill="#eef6f0" stroke="#6aab82" strokeWidth="1.5" />
      <circle cx="108" cy="100" r="5" fill="#eef6f0" stroke="#6aab82" strokeWidth="1.5" />

      {/* 星 */}
      <path
        d="M68 62l3.2 6.5 7.2 1-5.2 5.1 1.2 7.1-6.4-3.4-6.4 3.4 1.2-7.1-5.2-5.1 7.2-1 3.2-6.5z"
        fill="#4a9a68"
        opacity="0.85"
      />

      {/* チェックマーク */}
      <path
        d="M44 78l3 3 7-7"
        stroke="#6aab82"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* QRコード簡略 */}
      <rect x="84" y="74" width="14" height="14" rx="2" fill="#dce8de" />
      <rect x="86" y="76" width="4" height="4" fill="#6aab82" />
      <rect x="92" y="76" width="4" height="4" fill="#6aab82" />
      <rect x="86" y="82" width="4" height="4" fill="#6aab82" />

      {/* スタブ側バーコード */}
      <rect x="114" y="58" width="2" height="20" rx="0.5" fill="#b8dcc8" />
      <rect x="118" y="58" width="3" height="20" rx="0.5" fill="#6aab82" opacity="0.6" />
      <rect x="123" y="58" width="2" height="20" rx="0.5" fill="#b8dcc8" />
      <rect x="127" y="58" width="2.5" height="20" rx="0.5" fill="#6aab82" opacity="0.5" />
    </svg>
  );
}
