"use client";

export function BackgroundIllustration() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden"
      aria-hidden
    >
      <img
        src="/hero-festival.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-[0.18] dark:opacity-[0.08]"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-white/50 via-white/25 to-white/60 dark:from-zinc-950/75 dark:via-zinc-950/60 dark:to-zinc-950/80"
        aria-hidden
      />
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.04] dark:opacity-[0.02]"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 800"
        style={{ color: "#737373" }}
      >
        <defs>
          <pattern
            id="leaves"
            x="0"
            y="0"
            width="180"
            height="180"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M20 60 Q25 45 30 60 Q25 55 20 60"
              fill="currentColor"
              opacity="0.25"
            />
            <path
              d="M100 30 Q105 15 110 30 Q105 25 100 30"
              fill="currentColor"
              opacity="0.2"
            />
            <path
              d="M70 120 Q72 110 75 120 Q72 115 70 120"
              fill="currentColor"
              opacity="0.22"
            />
          </pattern>
          <pattern
            id="grass"
            x="0"
            y="0"
            width="60"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M10 80 Q8 40 12 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.2"
            />
            <path
              d="M25 80 Q22 50 26 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.18"
            />
            <path
              d="M40 80 Q38 45 42 15"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.2"
            />
            <path
              d="M55 80 Q52 55 56 25"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.15"
            />
          </pattern>
          <pattern
            id="sakura"
            x="0"
            y="0"
            width="150"
            height="150"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="30" cy="40" r="4" fill="currentColor" opacity="0.4" />
            <circle cx="120" cy="90" r="3" fill="currentColor" opacity="0.3" />
            <path
              d="M75 20 Q78 25 75 30 Q72 25 75 20"
              fill="currentColor"
              opacity="0.35"
            />
          </pattern>
        </defs>
        {/* 山・丘のシルエット（奥） */}
        <path
          d="M0 800 L0 500 Q200 450 400 500 Q600 420 800 480 Q1000 400 1200 460 L1200 800 Z"
          fill="currentColor"
          opacity="0.04"
        />
        <path
          d="M0 800 L0 550 Q250 500 500 560 Q750 480 1000 520 L1200 480 L1200 800 Z"
          fill="currentColor"
          opacity="0.03"
        />
        <path
          d="M0 800 L0 620 Q400 580 700 620 Q950 560 1200 600 L1200 800 Z"
          fill="currentColor"
          opacity="0.025"
        />
        {/* 葉パターン */}
        <rect width="100%" height="100%" fill="url(#leaves)" />
        <rect width="100%" height="100%" fill="url(#sakura)" />
        {/* 波 */}
        <path
          d="M0 600 Q300 550 600 600 T1200 600 L1200 800 L0 800 Z"
          fill="currentColor"
          opacity="0.03"
        />
        <path
          d="M0 650 Q400 600 800 650 T1200 650 L1200 800 L0 800 Z"
          fill="currentColor"
          opacity="0.02"
        />
        {/* 草・植物（下部・波付近） */}
        <rect
          x="0"
          y="520"
          width="1200"
          height="280"
          fill="url(#grass)"
          opacity="0.5"
        />
      </svg>
    </div>
  );
}
