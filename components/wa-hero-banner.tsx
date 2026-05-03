type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** true のとき高さ 130px(mobile)/160px(PC)、false(default)で 200px(mobile)/300px(PC) */
  compact?: boolean;
  className?: string;
};

export function WaHeroBanner({
  eyebrow,
  title,
  subtitle,
  compact = false,
  className = "",
}: Props) {
  const pfx = compact ? "wab-c" : "wab-f";

  return (
    <div
      className={`relative overflow-hidden ${compact ? "h-[130px] sm:h-[160px]" : "h-[200px] sm:h-[300px]"} ${className}`}
      style={{
        background: "linear-gradient(to bottom right, #1e4868 0%, #2a5870 40%, #245858 75%, #1e3c28 100%)",
        boxShadow: "0 0 0 3px #c8a030, 0 0 0 6px #2a1800, 0 0 0 9px #c8a030, 0 8px 32px rgba(0,0,0,0.4)",
        borderRadius: "4px",
      }}
    >
      {compact ? (
        /* ── Compact SVG (viewBox 900×160) ── */
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 900 160"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <pattern id={`${pfx}-sg`} x="0" y="0" width="44" height="25" patternUnits="userSpaceOnUse">
              <path d="M22 0 Q44 12.5 22 25 Q0 12.5 22 0Z" fill="none" stroke="#80d0e8" strokeWidth="1.1" opacity="0.14"/>
              <path d="M0 12.5 Q22 25 44 12.5" fill="none" stroke="#80d0e8" strokeWidth="0.6" opacity="0.08"/>
            </pattern>
            <pattern id={`${pfx}-sp`} x="0" y="0" width="26" height="26" patternUnits="userSpaceOnUse">
              <circle cx="13" cy="13" r="12" fill="none" stroke="#d4b040" strokeWidth="0.5" opacity="0.12"/>
              <circle cx="0"  cy="0"  r="12" fill="none" stroke="#d4b040" strokeWidth="0.5" opacity="0.12"/>
              <circle cx="26" cy="0"  r="12" fill="none" stroke="#d4b040" strokeWidth="0.5" opacity="0.12"/>
              <circle cx="0"  cy="26" r="12" fill="none" stroke="#d4b040" strokeWidth="0.5" opacity="0.12"/>
              <circle cx="26" cy="26" r="12" fill="none" stroke="#d4b040" strokeWidth="0.5" opacity="0.12"/>
            </pattern>
            <radialGradient id={`${pfx}-k1`} cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#f0d860" stopOpacity="0.65"/>
              <stop offset="55%"  stopColor="#d4b040" stopOpacity="0.32"/>
              <stop offset="100%" stopColor="#d4b040" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id={`${pfx}-k2`} cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#ecd050" stopOpacity="0.50"/>
              <stop offset="55%"  stopColor="#d4b040" stopOpacity="0.24"/>
              <stop offset="100%" stopColor="#d4b040" stopOpacity="0"/>
            </radialGradient>
            <linearGradient id={`${pfx}-to`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#1e4868" stopOpacity="0.97"/>
              <stop offset="42%"  stopColor="#1e4868" stopOpacity="0.52"/>
              <stop offset="100%" stopColor="#1e4868" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${pfx}-sg)`}/>
          <rect width="100%" height="100%" fill={`url(#${pfx}-sp)`}/>
          <circle cx="800" cy="38" r="52" fill="#f0e478" opacity="0.20"/>
          <circle cx="800" cy="38" r="35" fill="#f8ee90" opacity="0.26"/>
          <circle cx="800" cy="38" r="20" fill="#fef8b0" opacity="0.32"/>
          <ellipse cx="770" cy="25"  rx="170" ry="20" fill={`url(#${pfx}-k1)`} opacity="0.85"/>
          <ellipse cx="820" cy="14"  rx="115" ry="13" fill={`url(#${pfx}-k1)`} opacity="0.70"/>
          <ellipse cx="690" cy="38"  rx="95"  ry="11" fill={`url(#${pfx}-k2)`} opacity="0.60"/>
          <ellipse cx="620" cy="140" rx="190" ry="22" fill={`url(#${pfx}-k1)`} opacity="0.65"/>
          <ellipse cx="700" cy="148" rx="140" ry="16" fill={`url(#${pfx}-k1)`} opacity="0.55"/>
          <ellipse cx="780" cy="153" rx="110" ry="13" fill={`url(#${pfx}-k2)`} opacity="0.50"/>
          <ellipse cx="510" cy="148" rx="90"  ry="12" fill={`url(#${pfx}-k2)`} opacity="0.42"/>
          <path d="M840 160 Q838 180 842 140 Q845 100 838 55" stroke="#163010" strokeWidth="9" fill="none" strokeLinecap="round" opacity="0.90"/>
          <path d="M840 160 Q838 180 842 140 Q845 100 838 55" stroke="#2c5020" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.65"/>
          <path d="M840 110 Q800 90 740 65 Q700 48 660 38" stroke="#1e3c10" strokeWidth="5.5" fill="none" strokeLinecap="round" opacity="0.85"/>
          <path d="M760 72 Q748 58 738 45" stroke="#1e3c10" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.75"/>
          <path d="M720 55 Q710 42 702 30" stroke="#1e3c10" strokeWidth="2.0" fill="none" strokeLinecap="round" opacity="0.70"/>
          <path d="M840 80 Q870 62 895 42 Q910 30 918 18" stroke="#1e3c10" strokeWidth="4.5" fill="none" strokeLinecap="round" opacity="0.80"/>
          <path d="M858 68 Q878 52 900 38" stroke="#1e3c10" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.65"/>
          <path d="M840 130 Q795 114 750 104 Q710 96 675 94" stroke="#1e3c10" strokeWidth="4.5" fill="none" strokeLinecap="round" opacity="0.80"/>
          <path d="M760 106 Q745 94 735 82" stroke="#1e3c10" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.70"/>
          <path d="M842 148 Q875 133 905 120" stroke="#1e3c10" strokeWidth="4.0" fill="none" strokeLinecap="round" opacity="0.75"/>
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
          <ellipse cx="730" cy="92"  rx="30" ry="13" fill="#285c20" opacity="0.75" transform="rotate(-8 730 92)"/>
          <ellipse cx="898" cy="112" rx="28" ry="13" fill="#285c20" opacity="0.72" transform="rotate(-15 898 112)"/>
          <path d="M380 130 Q480 90 590 115 Q700 140 820 108 L900 96 L900 160 L380 160Z" fill="#1a3c28" opacity="0.55"/>
          <path d="M420 145 Q520 128 638 140 Q755 152 870 128 L900 124 L900 160 L420 160Z" fill="#162e1e" opacity="0.50"/>
          <path d="M460 150 Q530 140 600 150 Q670 158 745 147 Q820 136 900 148 L900 160 L460 160Z" fill="#203848" opacity="0.65"/>
          <ellipse cx="680" cy="156" rx="88" ry="8" fill="none" stroke="#80d0e8" strokeWidth="0.9" opacity="0.25"/>
          <circle cx="385" cy="30" r="22" fill="none" stroke="#d4b040" strokeWidth="1.0" opacity="0.55"/>
          <circle cx="385" cy="30" r="14" fill="none" stroke="#d4b040" strokeWidth="0.7" opacity="0.45"/>
          <path d="M385 8 L385 52 M363 30 L407 30 M370 15 L400 45 M400 15 L370 45" stroke="#d4b040" strokeWidth="0.55" opacity="0.38"/>
          <circle cx="385" cy="30" r="4" fill="#d4b040" opacity="0.48"/>
          <rect width="100%" height="100%" fill={`url(#${pfx}-to)`}/>
          <line x1="450" y1="0" x2="450" y2="100%" stroke="#d4b040" strokeWidth="1.2" opacity="0.22"/>
          <rect x="0" y="0"   width="100%" height="3" fill="#d4b040" opacity="0.88"/>
          <rect x="0" y="157" width="100%" height="3" fill="#d4b040" opacity="0.68"/>
        </svg>
      ) : (
        /* ── Full SVG (viewBox 900×300) ── */
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 900 300"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <pattern id={`${pfx}-sg`} x="0" y="0" width="44" height="25" patternUnits="userSpaceOnUse">
              <path d="M22 0 Q44 12.5 22 25 Q0 12.5 22 0Z" fill="none" stroke="#80d0e8" strokeWidth="1.1" opacity="0.14"/>
              <path d="M0 12.5 Q22 25 44 12.5" fill="none" stroke="#80d0e8" strokeWidth="0.6" opacity="0.08"/>
            </pattern>
            <pattern id={`${pfx}-sp`} x="0" y="0" width="26" height="26" patternUnits="userSpaceOnUse">
              <circle cx="13" cy="13" r="12" fill="none" stroke="#d4b040" strokeWidth="0.5" opacity="0.12"/>
              <circle cx="0"  cy="0"  r="12" fill="none" stroke="#d4b040" strokeWidth="0.5" opacity="0.12"/>
              <circle cx="26" cy="0"  r="12" fill="none" stroke="#d4b040" strokeWidth="0.5" opacity="0.12"/>
              <circle cx="0"  cy="26" r="12" fill="none" stroke="#d4b040" strokeWidth="0.5" opacity="0.12"/>
              <circle cx="26" cy="26" r="12" fill="none" stroke="#d4b040" strokeWidth="0.5" opacity="0.12"/>
            </pattern>
            <radialGradient id={`${pfx}-k1`} cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#f0d860" stopOpacity="0.65"/>
              <stop offset="55%"  stopColor="#d4b040" stopOpacity="0.32"/>
              <stop offset="100%" stopColor="#d4b040" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id={`${pfx}-k2`} cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#ecd050" stopOpacity="0.50"/>
              <stop offset="55%"  stopColor="#d4b040" stopOpacity="0.24"/>
              <stop offset="100%" stopColor="#d4b040" stopOpacity="0"/>
            </radialGradient>
            <linearGradient id={`${pfx}-to`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#1e4868" stopOpacity="0.97"/>
              <stop offset="42%"  stopColor="#1e4868" stopOpacity="0.52"/>
              <stop offset="100%" stopColor="#1e4868" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${pfx}-sg)`}/>
          <rect width="100%" height="100%" fill={`url(#${pfx}-sp)`}/>
          <circle cx="800" cy="38" r="52" fill="#f0e478" opacity="0.20"/>
          <circle cx="800" cy="38" r="35" fill="#f8ee90" opacity="0.26"/>
          <circle cx="800" cy="38" r="20" fill="#fef8b0" opacity="0.32"/>
          <ellipse cx="770" cy="25"  rx="170" ry="20" fill={`url(#${pfx}-k1)`} opacity="0.85"/>
          <ellipse cx="820" cy="14"  rx="115" ry="13" fill={`url(#${pfx}-k1)`} opacity="0.70"/>
          <ellipse cx="690" cy="38"  rx="95"  ry="11" fill={`url(#${pfx}-k2)`} opacity="0.60"/>
          <ellipse cx="620" cy="280" rx="190" ry="22" fill={`url(#${pfx}-k1)`} opacity="0.65"/>
          <ellipse cx="700" cy="288" rx="140" ry="16" fill={`url(#${pfx}-k1)`} opacity="0.55"/>
          <ellipse cx="780" cy="292" rx="110" ry="13" fill={`url(#${pfx}-k2)`} opacity="0.50"/>
          <ellipse cx="510" cy="288" rx="90"  ry="12" fill={`url(#${pfx}-k2)`} opacity="0.42"/>
          <path d="M840 300 Q838 280 842 230 Q845 175 838 110" stroke="#163010" strokeWidth="9" fill="none" strokeLinecap="round" opacity="0.90"/>
          <path d="M840 300 Q838 280 842 230 Q845 175 838 110" stroke="#2c5020" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.65"/>
          <path d="M840 200 Q800 178 740 148 Q700 128 660 112" stroke="#1e3c10" strokeWidth="5.5" fill="none" strokeLinecap="round" opacity="0.85"/>
          <path d="M760 155 Q748 138 738 122" stroke="#1e3c10" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.75"/>
          <path d="M720 135 Q710 118 702 105" stroke="#1e3c10" strokeWidth="2.0" fill="none" strokeLinecap="round" opacity="0.70"/>
          <path d="M840 155 Q870 132 895 108 Q910 92 918 75" stroke="#1e3c10" strokeWidth="4.5" fill="none" strokeLinecap="round" opacity="0.80"/>
          <path d="M858 140 Q878 118 900 100" stroke="#1e3c10" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.65"/>
          <path d="M840 245 Q795 224 750 212 Q710 202 675 200" stroke="#1e3c10" strokeWidth="4.5" fill="none" strokeLinecap="round" opacity="0.80"/>
          <path d="M760 215 Q745 200 735 185" stroke="#1e3c10" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.70"/>
          <path d="M842 270 Q875 252 905 238" stroke="#1e3c10" strokeWidth="4.0" fill="none" strokeLinecap="round" opacity="0.75"/>
          <ellipse cx="650" cy="106" rx="34" ry="15" fill="#285c20" opacity="0.82" transform="rotate(-20 650 106)"/>
          <ellipse cx="668" cy="95"  rx="28" ry="13" fill="#306228" opacity="0.72" transform="rotate(8 668 95)"/>
          <ellipse cx="633" cy="100" rx="24" ry="11" fill="#285c20" opacity="0.68" transform="rotate(-35 633 100)"/>
          <ellipse cx="697" cy="108" rx="30" ry="14" fill="#2c6022" opacity="0.75" transform="rotate(-10 697 108)"/>
          <ellipse cx="730" cy="138" rx="32" ry="14" fill="#285c20" opacity="0.78" transform="rotate(-15 730 138)"/>
          <ellipse cx="750" cy="126" rx="26" ry="12" fill="#306228" opacity="0.68" transform="rotate(12 750 126)"/>
          <ellipse cx="793" cy="152" rx="28" ry="13" fill="#285c20" opacity="0.72" transform="rotate(-8 793 152)"/>
          <ellipse cx="902" cy="100" rx="32" ry="14" fill="#285c20" opacity="0.78" transform="rotate(-25 902 100)"/>
          <ellipse cx="882" cy="90"  rx="27" ry="12" fill="#2c6022" opacity="0.68" transform="rotate(5 882 90)"/>
          <ellipse cx="864" cy="125" rx="30" ry="13" fill="#285c20" opacity="0.72" transform="rotate(-18 864 125)"/>
          <ellipse cx="670" cy="192" rx="32" ry="14" fill="#285c20" opacity="0.78" transform="rotate(-12 670 192)"/>
          <ellipse cx="688" cy="180" rx="26" ry="12" fill="#306228" opacity="0.68" transform="rotate(10 688 180)"/>
          <ellipse cx="730" cy="202" rx="30" ry="13" fill="#285c20" opacity="0.75" transform="rotate(-8 730 202)"/>
          <ellipse cx="898" cy="230" rx="28" ry="13" fill="#285c20" opacity="0.72" transform="rotate(-15 898 230)"/>
          <path d="M380 245 Q480 200 590 228 Q700 255 820 222 L900 210 L900 300 L380 300Z" fill="#1a3c28" opacity="0.55"/>
          <path d="M420 268 Q520 248 638 262 Q755 276 870 252 L900 248 L900 300 L420 300Z" fill="#162e1e" opacity="0.50"/>
          <path d="M460 285 Q530 272 600 284 Q670 296 745 282 Q820 268 900 280 L900 300 L460 300Z" fill="#203848" opacity="0.65"/>
          <ellipse cx="680" cy="292" rx="88" ry="8" fill="none" stroke="#80d0e8" strokeWidth="0.9" opacity="0.25"/>
          <ellipse cx="680" cy="292" rx="60" ry="5" fill="none" stroke="#80d0e8" strokeWidth="0.6" opacity="0.18"/>
          <circle cx="385" cy="48" r="22" fill="none" stroke="#d4b040" strokeWidth="1.0" opacity="0.55"/>
          <circle cx="385" cy="48" r="14" fill="none" stroke="#d4b040" strokeWidth="0.7" opacity="0.45"/>
          <path d="M385 26 L385 70 M363 48 L407 48 M370 33 L400 63 M400 33 L370 63" stroke="#d4b040" strokeWidth="0.55" opacity="0.38"/>
          <circle cx="385" cy="48" r="4" fill="#d4b040" opacity="0.48"/>
          <rect width="100%" height="100%" fill={`url(#${pfx}-to)`}/>
          <line x1="450" y1="0" x2="450" y2="100%" stroke="#d4b040" strokeWidth="1.2" opacity="0.22"/>
          <rect x="0" y="0"   width="100%" height="3" fill="#d4b040" opacity="0.88"/>
          <rect x="0" y="297" width="100%" height="3" fill="#d4b040" opacity="0.68"/>
        </svg>
      )}

      {/* テキスト */}
      <div className={`absolute left-5 flex flex-col justify-end ${compact ? "bottom-4" : "bottom-6 sm:bottom-8"}`}>
        {eyebrow && (
          <p
            className="text-[9px] font-medium tracking-[0.25em]"
            style={{ color: "#d4b040" }}
          >
            {eyebrow}
          </p>
        )}
        <h1
          className={`mt-0.5 font-semibold leading-snug tracking-[0.05em] [text-shadow:0_2px_14px_rgba(0,0,0,0.45)] ${
            compact ? "text-[20px] sm:text-[26px]" : "text-[25px] sm:text-[32px]"
          }`}
          style={{
            fontFamily: "'Shippori Mincho', 'Noto Serif JP', serif",
            color: "#f0f6fa",
            lineHeight: 1.25,
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
      </div>
    </div>
  );
}
