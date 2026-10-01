"use client";

import Image from "next/image";

const HERO_IMAGE = "/home/pc/hero-townscape.png";

function Leaf({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 28 28" fill="none" aria-hidden>
      <path
        d="M6 20c6-2 10-8 12-16 1 8 4 13 10 16-6 1-11 4-16 10-1-4-3-7-6-10Z"
        fill="#7dbe78"
      />
    </svg>
  );
}

/** まちの情報PC：イラストヒーロー */
export function PcTownBrowseHero() {
  return (
    <section
      className="relative h-[148px] overflow-hidden rounded-[18px] bg-[#f4f7ee] shadow-[0_2px_12px_rgba(22,40,28,0.06)]"
      aria-label="まちの情報を探す"
    >
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        className="object-cover object-[72%_center]"
        sizes="(min-width: 900px) 1000px, 100vw"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#f7fbf4]/95 via-[#f7fbf4]/55 to-transparent"
        aria-hidden
      />
      <Leaf className="pointer-events-none absolute left-[38%] top-2 h-6 w-6 rotate-12 opacity-80" />
      <Leaf className="pointer-events-none absolute bottom-2 left-[46%] h-5 w-5 -rotate-12 opacity-70" />

      <div className="relative flex h-full items-center px-6">
        <div className="max-w-[420px]">
          <h1
            className="text-[26px] font-medium leading-[1.25] tracking-[0.04em] text-[#245c38]"
            style={{
              fontFamily: "var(--font-serif-display), 'Shippori Mincho', 'Noto Serif JP', serif",
            }}
          >
            まちで出会う、
            <br />
            今日のワクワク
          </h1>
          <p className="mt-1 text-[12px] leading-snug text-[#4d6556]">
            イベント・お店・体験・ボランティア…
            <br />
            まちのいろんな魅力を見つけよう。
          </p>
        </div>

        <div className="absolute right-6 top-1/2 hidden w-[156px] -translate-y-1/2 rotate-2 rounded-[4px] bg-[#fbf6e4]/92 px-2.5 py-1.5 shadow-[0_6px_16px_rgba(120,90,40,0.12)] ring-1 ring-[#eadcba] lg:block">
          <p
            className="text-[13px] leading-snug text-[#6a5330]"
            style={{
              fontFamily: "var(--font-serif-display), 'Shippori Mincho', 'Noto Serif JP', serif",
            }}
          >
            いつものまちに
            <br />
            ちょっといい出会いを
          </p>
        </div>
      </div>
    </section>
  );
}
