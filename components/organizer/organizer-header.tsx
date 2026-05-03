"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { useUnreadCount } from "@/hooks/use-unread-count";
import { cn } from "@/lib/utils";

const MESSAGES_HREF = "/messages";

type Props = {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  description?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  backHref?: string;
  backLabel?: string;
  showMessages?: boolean;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  showPrimaryCta?: boolean;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  tertiaryCtaHref?: string;
  tertiaryCtaLabel?: string;
  tertiaryCtaHighlight?: boolean;
};

export function OrganizerHeader({
  title,
  eyebrow,
  subtitle,
  description,
  backHref = "/events",
  backLabel = "← イベント一覧へ",
  showMessages = true,
  primaryCtaLabel = "新規作成",
  primaryCtaHref = "/organizer/events/new",
  showPrimaryCta = true,
  secondaryCtaLabel,
  secondaryCtaHref,
  tertiaryCtaHref,
  tertiaryCtaLabel = "売上受取設定",
  tertiaryCtaHighlight,
}: Props) {
  const unreadCount = useUnreadCount(true);

  return (
    <header
      className="overflow-hidden rounded-sm"
      style={{
        boxShadow: "0 0 0 3px #c8a030, 0 0 0 6px #2a1800, 0 0 0 9px #c8a030, 0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {/* 屏風絵ヒーローバナー */}
      <div
        className="relative h-[130px] overflow-hidden sm:h-[160px]"
        style={{
          background: "linear-gradient(to bottom right, #1e4868 0%, #2a5870 40%, #245858 75%, #1e3c28 100%)",
        }}
      >
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 900 160"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <pattern id="seigaiha-org-header" x="0" y="0" width="44" height="25" patternUnits="userSpaceOnUse">
              <path d="M22 0 Q44 12.5 22 25 Q0 12.5 22 0Z" fill="none" stroke="#80d0e8" strokeWidth="1.1" opacity="0.14"/>
              <path d="M0 12.5 Q22 25 44 12.5" fill="none" stroke="#80d0e8" strokeWidth="0.6" opacity="0.08"/>
            </pattern>
            <pattern id="shippo-org-header" x="0" y="0" width="26" height="26" patternUnits="userSpaceOnUse">
              <circle cx="13" cy="13" r="12" fill="none" stroke="#d4b040" strokeWidth="0.5" opacity="0.12"/>
              <circle cx="0"  cy="0"  r="12" fill="none" stroke="#d4b040" strokeWidth="0.5" opacity="0.12"/>
              <circle cx="26" cy="0"  r="12" fill="none" stroke="#d4b040" strokeWidth="0.5" opacity="0.12"/>
              <circle cx="0"  cy="26" r="12" fill="none" stroke="#d4b040" strokeWidth="0.5" opacity="0.12"/>
              <circle cx="26" cy="26" r="12" fill="none" stroke="#d4b040" strokeWidth="0.5" opacity="0.12"/>
            </pattern>
            <radialGradient id="kumo1-org-header" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#f0d860" stopOpacity="0.65"/>
              <stop offset="55%"  stopColor="#d4b040" stopOpacity="0.32"/>
              <stop offset="100%" stopColor="#d4b040" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="kumo2-org-header" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#ecd050" stopOpacity="0.50"/>
              <stop offset="55%"  stopColor="#d4b040" stopOpacity="0.24"/>
              <stop offset="100%" stopColor="#d4b040" stopOpacity="0"/>
            </radialGradient>
            <linearGradient id="textOverlay-org-header" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#1e4868" stopOpacity="0.97"/>
              <stop offset="42%"  stopColor="#1e4868" stopOpacity="0.52"/>
              <stop offset="100%" stopColor="#1e4868" stopOpacity="0"/>
            </linearGradient>
          </defs>

          {/* 青海波・七宝つなぎ */}
          <rect width="100%" height="100%" fill="url(#seigaiha-org-header)"/>
          <rect width="100%" height="100%" fill="url(#shippo-org-header)"/>

          {/* 月（右上） */}
          <circle cx="800" cy="38" r="52" fill="#f0e478" opacity="0.20"/>
          <circle cx="800" cy="38" r="35" fill="#f8ee90" opacity="0.26"/>
          <circle cx="800" cy="38" r="20" fill="#fef8b0" opacity="0.32"/>

          {/* 金泥雲（上部） */}
          <ellipse cx="770" cy="25"  rx="170" ry="20" fill="url(#kumo1-org-header)" opacity="0.85"/>
          <ellipse cx="820" cy="14"  rx="115" ry="13" fill="url(#kumo1-org-header)" opacity="0.70"/>
          <ellipse cx="690" cy="38"  rx="95"  ry="11" fill="url(#kumo2-org-header)" opacity="0.60"/>

          {/* 金泥雲（下部 cy=bannerHeight-20=140） */}
          <ellipse cx="620" cy="140" rx="190" ry="22" fill="url(#kumo1-org-header)" opacity="0.65"/>
          <ellipse cx="700" cy="148" rx="140" ry="16" fill="url(#kumo1-org-header)" opacity="0.55"/>
          <ellipse cx="780" cy="153" rx="110" ry="13" fill="url(#kumo2-org-header)" opacity="0.50"/>
          <ellipse cx="510" cy="148" rx="90"  ry="12" fill="url(#kumo2-org-header)" opacity="0.42"/>

          {/* 大きな松（右側）幹 */}
          <path d="M840 160 Q838 180 842 140 Q845 100 838 55"
                stroke="#163010" strokeWidth="9" fill="none" strokeLinecap="round" opacity="0.90"/>
          <path d="M840 160 Q838 180 842 140 Q845 100 838 55"
                stroke="#2c5020" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.65"/>

          {/* 主枝1（左上） */}
          <path d="M840 110 Q800 90 740 65 Q700 48 660 38"
                stroke="#1e3c10" strokeWidth="5.5" fill="none" strokeLinecap="round" opacity="0.85"/>
          <path d="M760 72 Q748 58 738 45" stroke="#1e3c10" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.75"/>
          <path d="M720 55 Q710 42 702 30" stroke="#1e3c10" strokeWidth="2.0" fill="none" strokeLinecap="round" opacity="0.70"/>

          {/* 主枝2（右上） */}
          <path d="M840 80 Q870 62 895 42 Q910 30 918 18"
                stroke="#1e3c10" strokeWidth="4.5" fill="none" strokeLinecap="round" opacity="0.80"/>
          <path d="M858 68 Q878 52 900 38"
                stroke="#1e3c10" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.65"/>

          {/* 主枝3（左中段） */}
          <path d="M840 130 Q795 114 750 104 Q710 96 675 94"
                stroke="#1e3c10" strokeWidth="4.5" fill="none" strokeLinecap="round" opacity="0.80"/>
          <path d="M760 106 Q745 94 735 82" stroke="#1e3c10" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.70"/>
          <path d="M715 98 Q700 86 690 74" stroke="#1e3c10" strokeWidth="2.0" fill="none" strokeLinecap="round" opacity="0.65"/>

          {/* 主枝4（右中段） */}
          <path d="M842 148 Q875 133 905 120"
                stroke="#1e3c10" strokeWidth="4.0" fill="none" strokeLinecap="round" opacity="0.75"/>

          {/* 松葉の房 */}
          <ellipse cx="650" cy="32"  rx="34" ry="15" fill="#285c20" opacity="0.82" transform="rotate(-20 650 32)"/>
          <ellipse cx="668" cy="22"  rx="28" ry="13" fill="#306228" opacity="0.72" transform="rotate(8 668 22)"/>
          <ellipse cx="633" cy="25"  rx="24" ry="11" fill="#285c20" opacity="0.68" transform="rotate(-35 633 25)"/>
          <ellipse cx="697" cy="33"  rx="30" ry="14" fill="#2c6022" opacity="0.75" transform="rotate(-10 697 33)"/>
          <ellipse cx="730" cy="57"  rx="32" ry="14" fill="#285c20" opacity="0.78" transform="rotate(-15 730 57)"/>
          <ellipse cx="750" cy="46"  rx="26" ry="12" fill="#306228" opacity="0.68" transform="rotate(12 750 46)"/>
          <ellipse cx="713" cy="50"  rx="24" ry="11" fill="#285c20" opacity="0.65" transform="rotate(-30 713 50)"/>
          <ellipse cx="793" cy="68"  rx="28" ry="13" fill="#285c20" opacity="0.72" transform="rotate(-8 793 68)"/>
          <ellipse cx="810" cy="60"  rx="24" ry="11" fill="#306228" opacity="0.65" transform="rotate(15 810 60)"/>
          <ellipse cx="902" cy="30"  rx="32" ry="14" fill="#285c20" opacity="0.78" transform="rotate(-25 902 30)"/>
          <ellipse cx="882" cy="23"  rx="27" ry="12" fill="#2c6022" opacity="0.68" transform="rotate(5 882 23)"/>
          <ellipse cx="864" cy="53"  rx="30" ry="13" fill="#285c20" opacity="0.72" transform="rotate(-18 864 53)"/>
          <ellipse cx="670" cy="84"  rx="32" ry="14" fill="#285c20" opacity="0.78" transform="rotate(-12 670 84)"/>
          <ellipse cx="688" cy="74"  rx="26" ry="12" fill="#306228" opacity="0.68" transform="rotate(10 688 74)"/>
          <ellipse cx="653" cy="78"  rx="24" ry="11" fill="#285c20" opacity="0.65" transform="rotate(-28 653 78)"/>
          <ellipse cx="730" cy="92"  rx="30" ry="13" fill="#285c20" opacity="0.75" transform="rotate(-8 730 92)"/>
          <ellipse cx="748" cy="82"  rx="24" ry="11" fill="#306228" opacity="0.65" transform="rotate(14 748 82)"/>
          <ellipse cx="898" cy="112" rx="28" ry="13" fill="#285c20" opacity="0.72" transform="rotate(-15 898 112)"/>
          <ellipse cx="880" cy="104" rx="24" ry="11" fill="#2c6022" opacity="0.65" transform="rotate(8 880 104)"/>

          {/* 山シルエット（遠景）bannerHeight=160 */}
          <path d="M380 130 Q480 90 590 115 Q700 140 820 108 L900 96 L900 160 L380 160Z"
                fill="#1a3c28" opacity="0.55"/>
          <path d="M420 145 Q520 128 638 140 Q755 152 870 128 L900 124 L900 160 L420 160Z"
                fill="#162e1e" opacity="0.50"/>

          {/* 水面（下部 cy=bannerHeight-10=150） */}
          <path d="M460 150 Q530 140 600 150 Q670 158 745 147 Q820 136 900 148 L900 160 L460 160Z"
                fill="#203848" opacity="0.65"/>
          <ellipse cx="680" cy="156" rx="88" ry="8" fill="none" stroke="#80d0e8" strokeWidth="0.9" opacity="0.25"/>
          <ellipse cx="680" cy="156" rx="60" ry="5" fill="none" stroke="#80d0e8" strokeWidth="0.6" opacity="0.18"/>

          {/* 家紋（左上・金） */}
          <circle cx="385" cy="30" r="22" fill="none" stroke="#d4b040" strokeWidth="1.0" opacity="0.55"/>
          <circle cx="385" cy="30" r="14" fill="none" stroke="#d4b040" strokeWidth="0.7" opacity="0.45"/>
          <path d="M385 8 L385 52 M363 30 L407 30 M370 15 L400 45 M400 15 L370 45"
                stroke="#d4b040" strokeWidth="0.55" opacity="0.38"/>
          <circle cx="385" cy="30" r="4" fill="#d4b040" opacity="0.48"/>

          {/* テキスト側グラデーションオーバーレイ */}
          <rect width="100%" height="100%" fill="url(#textOverlay-org-header)"/>

          {/* 屏風の折り目（中央縦線） */}
          <line x1="450" y1="0" x2="450" y2="100%" stroke="#d4b040" strokeWidth="1.2" opacity="0.22"/>

          {/* 金の縁ライン（上下） */}
          <rect x="0" y="0"   width="100%" height="3" fill="#d4b040" opacity="0.88"/>
          <rect x="0" y="157" width="100%" height="3" fill="#d4b040" opacity="0.68"/>
        </svg>

        {/* テキストコンテンツ */}
        <div className="relative z-10 flex h-full flex-col justify-center px-5">
          {eyebrow && (
            <span
              className="mb-1 inline-block text-[9px] font-medium tracking-[0.25em]"
              style={{ color: "#d4b040" }}
            >
              {eyebrow}
            </span>
          )}
          <h1
            className="font-semibold leading-snug tracking-[0.05em] [text-shadow:0_2px_14px_rgba(0,0,0,0.45)]"
            style={{
              fontFamily: "'Shippori Mincho', 'Noto Serif JP', serif",
              fontSize: "clamp(18px, 4vw, 26px)",
              lineHeight: 1.25,
              color: "#f0f6fa",
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="mt-0.5 text-[12px] tracking-[0.06em]"
              style={{ color: "rgba(190, 228, 242, 0.80)" }}
            >
              {subtitle}
            </p>
          )}
          {description && (
            <p
              className="mt-1 text-[12px] leading-relaxed tracking-[0.06em]"
              style={{ color: "rgba(190, 228, 242, 0.80)" }}
            >
              {description}
            </p>
          )}
        </div>
      </div>

      {/* CTAライト帯 */}
      <div className="flex flex-wrap items-center gap-2 border-t border-[#ccc4b4] bg-[#faf8f2] px-4 py-3">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex min-h-[36px] items-center rounded-full border border-[#ccc4b4] bg-white px-3 text-[12px] font-medium text-[#6a6258] transition-colors hover:bg-[#f0ece4]"
          >
            {backLabel}
          </Link>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {showMessages && (
            <Link
              href={MESSAGES_HREF}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[#ccc4b4] bg-white px-3 text-[12px] font-medium text-[#3a3428] transition-colors hover:bg-[#f0ece4]"
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0" aria-hidden />
              メッセージ
              {unreadCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          )}
          {tertiaryCtaHref && (
            <Link
              href={tertiaryCtaHref}
              className={cn(
                "inline-flex min-h-[36px] items-center rounded-full border px-3 text-[12px] font-medium transition-colors",
                tertiaryCtaHighlight
                  ? "border-[#f0d8a0] bg-[#fef8e8] text-[#8a6820] hover:bg-[#fdf0cc]"
                  : "border-[#ccc4b4] bg-white text-[#3a3428] hover:bg-[#f0ece4]"
              )}
            >
              {tertiaryCtaLabel}
            </Link>
          )}
          {secondaryCtaHref && secondaryCtaLabel && (
            <Link
              href={secondaryCtaHref}
              className="inline-flex min-h-[36px] items-center rounded-full border border-[#ccc4b4] bg-white px-3 text-[12px] font-medium text-[#3a3428] transition-colors hover:bg-[#f0ece4]"
            >
              {secondaryCtaLabel}
            </Link>
          )}
          {showPrimaryCta && (
            <Link
              href={primaryCtaHref}
              className="inline-flex min-h-[36px] items-center rounded-full bg-[#1e3848] px-4 text-[12px] font-medium text-[#f4f0e8] transition-opacity hover:opacity-90 active:scale-[0.99]"
            >
              + {primaryCtaLabel}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
