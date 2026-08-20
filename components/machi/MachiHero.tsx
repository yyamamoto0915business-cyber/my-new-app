"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Check,
  LayoutGrid,
  UtensilsCrossed,
  Coffee,
  ShoppingBasket,
  Tag,
  HandHeart,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MACHI_QUICK_FILTERS } from "@/lib/machi/feed";
import { SearchLeafIcon } from "@/components/home/DiscoverHeroCatchphrase";

const HERO_IMAGE = "/machi/hero-street.png";
const ACCENT = "#E66B27";

const CHIP_ICONS: Record<string, React.ElementType | null> = {
  restaurant: UtensilsCrossed,
  cafe: Coffee,
  shop: ShoppingBasket,
  sale: Tag,
  volunteer: HandHeart,
  local: Users,
  all: LayoutGrid,
};

const ABOUT_POINTS = [
  "近くの店舗やお店の情報",
  "ボランティア・まちの募集",
  "暮らしに役立つ新着のお知らせ",
];

type Props = {
  searchQuery: string;
  onSearchQueryChange: (v: string) => void;
  activeChip: string;
  onChipClick: (key: string) => void;
};

/** PCまち情報ヒーロー（モック準拠・イベントPCヒーローと同型） */
export function MachiPcHero({
  searchQuery,
  onSearchQueryChange,
  activeChip,
  onChipClick,
}: Props) {
  return (
    <section
      className="relative overflow-hidden rounded-[16px] shadow-[0_2px_12px_rgba(15,23,42,0.06)]"
      aria-label="まち情報を探す"
    >
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        className="object-cover object-[88%_center]"
        sizes="(min-width: 900px) 1280px, 100vw"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#f7f4f0]/96 via-[#f7f4f0]/70 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[48%] bg-gradient-to-r from-[#f7f4f0]/98 to-transparent"
        aria-hidden
      />

      <div className="relative grid grid-cols-[minmax(0,1fr)_minmax(220px,260px)] items-center gap-4 px-5 py-3 lg:gap-6 lg:px-6 lg:py-3.5">
        <div className="flex min-w-0 flex-col gap-2.5">
          <div className="relative w-fit">
            <p
              className="inline-flex items-center gap-1 text-[12px] font-semibold tracking-[0.05em]"
              style={{ color: ACCENT }}
            >
              <Search className="h-3 w-3 shrink-0" strokeWidth={2.5} aria-hidden />
              まち情報
            </p>
            <div
              className="mt-0.5 h-px w-[4.5rem]"
              style={{ background: ACCENT }}
              aria-hidden
            />
          </div>

          <h1
            className="whitespace-nowrap text-[22px] font-semibold leading-[1.35] text-[#1e2818]"
            style={{
              fontFamily:
                "var(--font-serif-display), 'Shippori Mincho', 'Noto Serif JP', serif",
            }}
          >
            暮らしの近くに、新しい発見を。
          </h1>
          <p className="text-[12px] text-[#5a4a38]">
            地域の店舗や募集・お知らせを探せます
          </p>

          <div className="w-full max-w-[34rem]">
            <div className="flex h-10 items-center gap-2 rounded-full border border-[#e8d5c4] bg-white px-3.5 shadow-[0_3px_14px_rgba(120,70,30,0.08)]">
              <Search className="h-3.5 w-3.5 shrink-0" style={{ color: ACCENT }} aria-hidden />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="店名・地域・募集内容で探す"
                className="min-w-0 flex-1 bg-transparent text-[13px] text-[#1a2e22] placeholder:text-[#9a9088] outline-none"
              />
              <span style={{ color: ACCENT }}>
                <SearchLeafIcon className="h-3.5 w-3.5" />
              </span>
            </div>

            <div className="mt-1.5 flex flex-nowrap gap-1.5 overflow-x-auto pr-2 scrollbar-hide">
              {MACHI_QUICK_FILTERS.map(({ key, label }) => {
                const Icon = CHIP_ICONS[key];
                const isActive = activeChip === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onChipClick(key)}
                    className={cn(
                      "inline-flex h-7 shrink-0 items-center gap-1 rounded-full border px-2.5 text-[11px] font-medium shadow-sm transition",
                      isActive
                        ? "border-transparent text-white"
                        : "border-white/85 bg-white/92 text-[#5a4a38] hover:bg-white",
                    )}
                    style={isActive ? { background: ACCENT, borderColor: ACCENT } : undefined}
                  >
                    {Icon ? <Icon className="h-3 w-3" aria-hidden /> : null}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="self-center">
          <div className="w-full rounded-[12px] border border-white/80 bg-white/95 px-4 py-3.5 shadow-[0_8px_28px_rgba(15,23,42,0.09)] backdrop-blur-[2px]">
            <h2
              className="text-[13px] font-semibold text-[#0e1610]"
              style={{
                fontFamily:
                  "var(--font-shippori-mincho), 'Shippori Mincho', 'Noto Serif JP', serif",
              }}
            >
              MachiGlyphとは
            </h2>
            <p className="mt-1 text-[10px] leading-relaxed text-[#5a6a60]">
              店舗や募集など、まちの情報をひとつの場所で見つけられます。
            </p>
            <ul className="mt-2 space-y-1.5">
              {ABOUT_POINTS.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-1.5 text-[10px] leading-snug text-[#3d5c48]"
                >
                  <Check className="mt-0.5 h-3 w-3 shrink-0" style={{ color: ACCENT }} aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
            <Link
              href="/guide"
              className="mt-2.5 inline-flex h-8 w-full items-center justify-center gap-1 rounded-[9px] bg-[#1a2b3c] text-[11px] font-medium text-white transition hover:opacity-90"
            >
              詳しく見る
              <span aria-hidden>→</span>
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}

/** モバイルまち情報ヒーロー（イベント MobileDiscoverHero と同型） */
export function MachiMobileHero({
  searchQuery,
  onSearchQueryChange,
  activeChip,
  onChipClick,
}: Props) {
  return (
    <section className="mg-mobile-section p-0" aria-label="まち情報を探す">
      <div className="relative overflow-hidden rounded-[14px]">
        <div className="absolute inset-0">
          <Image
            src={HERO_IMAGE}
            alt=""
            fill
            priority
            className="object-cover object-[78%_35%] brightness-[1.05] saturate-[1.12]"
            sizes="100vw"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#fbf9f6] via-[#fbf9f6]/90 to-transparent"
            aria-hidden
          />
          <div
            className="absolute inset-y-0 left-0 w-[55%] bg-gradient-to-r from-[#fbf9f6] to-transparent"
            aria-hidden
          />
        </div>

        <div className="relative flex flex-col px-3 pb-1.5 pt-1.5">
          <p
            className="inline-flex w-fit items-center gap-1 text-[9px] font-semibold tracking-[0.05em]"
            style={{ color: ACCENT }}
          >
            <Search className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden />
            まち情報
          </p>
          <h1
            className="mt-0.5 text-[18px] font-semibold leading-[1.35] text-[#1e2818]"
            style={{
              fontFamily:
                "var(--font-serif-display), 'Shippori Mincho', 'Noto Serif JP', serif",
            }}
          >
            暮らしの近くに、
            <br />
            新しい発見を。
          </h1>
          <p className="mt-0.5 text-[11px] text-[#5a4a38]">
            店舗や募集・お知らせを探せます
          </p>

          <div className="mt-2 flex h-8 items-center gap-2 rounded-full border border-[#e8d5c4] bg-white px-3 shadow-[0_2px_12px_rgba(120,70,30,0.07)]">
            <Search className="h-3.5 w-3.5 shrink-0" style={{ color: ACCENT }} aria-hidden />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="店名・地域・募集内容で探す"
              className="min-w-0 flex-1 bg-transparent text-[11px] text-[#163828] placeholder:text-[#7a847c] outline-none"
            />
            <span style={{ color: ACCENT }}>
              <SearchLeafIcon className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-0.5 pb-2 pt-2">
        <div className="-mx-0.5 flex gap-2 overflow-x-auto px-0.5 pr-3 pb-0.5 scrollbar-hide">
          {MACHI_QUICK_FILTERS.map(({ key, label }) => {
            const Icon = CHIP_ICONS[key];
            const isActive = activeChip === key;
            const isAll = key === "all";
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChipClick(key)}
                className={cn(
                  "mg-mobile-chip",
                  isAll && isActive
                    ? "mg-mobile-chip-all"
                    : isActive
                      ? "border-transparent text-white"
                      : "mg-mobile-chip-inactive",
                )}
                style={
                  isActive && !isAll
                    ? { background: ACCENT, borderColor: ACCENT }
                    : undefined
                }
              >
                {Icon ? <Icon className="h-3 w-3" aria-hidden /> : null}
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
