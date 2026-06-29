"use client";

import Image from "next/image";

/** 売上受取設定 — PCヒーロー */
export function OrganizerPayoutsHero() {
  return (
    <section
      className="relative mb-2 hidden overflow-hidden rounded-[14px] px-3.5 py-3 shadow-[0_2px_12px_rgba(26,34,20,0.06)] min-[900px]:block"
      style={{
        background:
          "linear-gradient(100deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.72) 36%, rgba(245,248,245,0.38) 58%, transparent 82%), url(/events/pc-hero-landscape.jpg) center 40% / cover no-repeat",
      }}
      aria-label="売上受取設定"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, transparent 58%, rgba(245,248,245,0.72) 100%)",
        }}
        aria-hidden
      />
      <div className="relative z-[1] flex items-start gap-2.5">
        <Image
          src="/organizer/payouts/stripe-intro.png"
          alt=""
          width={36}
          height={36}
          className="mt-0.5 h-9 w-9 shrink-0 rounded-full object-contain"
          unoptimized
        />
        <div className="min-w-0">
          <h1
            className="text-[18px] font-medium leading-tight tracking-[0.06em] text-[#1a2214]"
            style={{
              fontFamily:
                "var(--font-shippori-mincho), var(--font-serif-display), var(--font-heading), serif",
            }}
          >
            売上受取設定
          </h1>
          <p className="mt-1 text-[11px] leading-relaxed text-[#566358]">
            Stripeで参加費などの売上を受け取るための設定です。
          </p>
        </div>
      </div>
    </section>
  );
}
