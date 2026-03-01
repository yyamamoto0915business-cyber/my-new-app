"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type BrandIntroProps = {
  fadeMs?: number;
  showSkip?: boolean;
};

export function BrandIntro({ fadeMs = 650, showSkip = false }: BrandIntroProps) {
  const [mounted, setMounted] = useState(true);
  const [visible, setVisible] = useState(true);
  const [enter] = useState(true); // 入場アニメ用（初回マウントでtrue）
  const closingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      timeoutRef.current.forEach(clearTimeout);
    };
  }, []);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setVisible(false);
    const t = setTimeout(() => setMounted(false), fadeMs);
    timeoutRef.current = [t];
  }, [fadeMs]);

  if (!mounted) return null;

  return (
    <>
      <style jsx global>{`
        @keyframes mgKenBurns {
          from {
            transform: scale(1);
          }
          to {
            transform: scale(1.08);
          }
        }
        @keyframes brand-intro-text-reveal {
          from {
            opacity: 0;
            transform: translateY(14px);
            filter: blur(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }
        .brand-intro-ken-burns {
          animation: mgKenBurns 2.6s ease-out forwards;
        }
        .brand-intro-text-reveal {
          animation: brand-intro-text-reveal 0.7s ease-out forwards;
        }
        .brand-intro-text-reveal-delay-1 {
          animation: brand-intro-text-reveal 0.7s ease-out 0.15s forwards;
          opacity: 0;
        }
        .brand-intro-text-reveal-delay-2 {
          animation: brand-intro-text-reveal 0.7s ease-out 0.3s forwards;
          opacity: 0;
        }
        .brand-intro-neon {
          text-shadow:
            0 2px 4px rgba(0, 0, 0, 0.95),
            0 4px 12px rgba(0, 0, 0, 0.85),
            0 0 8px rgba(184, 134, 11, 0.7),
            0 0 20px rgba(184, 134, 11, 0.5),
            0 0 40px rgba(184, 134, 11, 0.25);
        }
        .brand-intro-neon-subtle {
          text-shadow:
            0 2px 4px rgba(0, 0, 0, 0.9),
            0 4px 10px rgba(0, 0, 0, 0.75),
            0 0 6px rgba(184, 134, 11, 0.6),
            0 0 14px rgba(184, 134, 11, 0.35);
        }
        .brand-intro-stretch-x {
          display: inline-block;
          transform: scaleX(1.15);
          transform-origin: left center;
        }
      `}</style>
      <div
        className="fixed inset-0 z-[9999] transition-opacity"
        style={{
          opacity: visible ? 1 : 0,
          transitionDuration: `${fadeMs}ms`,
          pointerEvents: visible ? "auto" : "none",
        }}
        onKeyDown={(e) => e.key === "Enter" && close()}
        role="button"
        tabIndex={0}
        aria-label="ブランド紹介を閉じる"
      >
        {/* 上半分: Brand Intro（画像＋テキスト）※テキスト切れ防止で余裕を持たせる */}
        <div
          className="relative flex h-[58vh] shrink-0 cursor-pointer flex-col items-start justify-start overflow-visible pt-[6vh] pb-8"
          onPointerDown={close}
        >
          {/* Background image with Ken Burns effect（まちのイラスト） */}
          <div className="absolute top-0 left-0 right-0 h-[58vh] overflow-hidden bg-[#1a1a1a]">
            <div className="brand-intro-ken-burns absolute inset-[-4%]">
              <Image
                src="/brand/intro.png"
                fill
                className="object-cover object-center"
                alt=""
                priority
                sizes="100vw"
              />
            </div>
          </div>

          {/* テキスト可読性のための暗幕グラデ（下端は紙色に馴染む） */}
          <div
            className="pointer-events-none absolute top-0 left-0 right-0 h-[58vh]"
            style={{
              background:
                "linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.35) 70%, rgba(0,0,0,0.4) 100%), linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 45%, rgba(250,249,246,0.2) 75%, rgba(250,249,246,0.5) 100%)",
            }}
          />

          {/* Skip button (optional) */}
          {showSkip && (
            <button
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
                close();
              }}
              className="absolute right-5 top-5 z-10 rounded-full border border-white/30 bg-black/30 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm transition hover:bg-black/50 hover:text-white md:right-8 md:top-8"
              aria-label="スキップ"
            >
              Skip
            </button>
          )}

          {/* Left-aligned content */}
          <div className="relative z-10 mx-6 flex flex-1 flex-col md:mx-12">
            <div className="max-w-xl md:max-w-2xl">
              <h1 className="brand-intro-text-reveal brand-intro-neon brand-intro-stretch-x whitespace-nowrap font-serif text-5xl font-bold text-white md:text-6xl lg:text-7xl">
                MachiGlyph（マチグリフ）
              </h1>
              <p className="brand-intro-text-reveal-delay-1 brand-intro-neon-subtle mt-4 font-sans text-xl font-medium text-white md:text-2xl">
                まちの出来事に出会う
              </p>
              <p className="brand-intro-text-reveal-delay-2 brand-intro-neon-subtle mt-5 max-w-md font-sans text-lg leading-relaxed text-white/95 md:text-xl">
                散らばる出来事を、「しるし」に変える。
                <br />
                関わる人の輪が、ほどけず続く場所へ。
              </p>
            </div>
            <p className="brand-intro-text-reveal-delay-2 brand-intro-neon-subtle mt-auto pt-6 font-sans text-base font-medium tracking-wide text-white/90 md:text-lg">
              タップしてはじめる
            </p>
          </div>
        </div>

        {/* 下半分: ホーム画面を表示（タップで閉じる） */}
        <div
          className="absolute bottom-0 left-0 right-0 top-[58vh] cursor-pointer"
          onPointerDown={close}
          aria-hidden
        />
      </div>
    </>
  );
}
