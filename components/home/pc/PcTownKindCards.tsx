"use client";

import Image from "next/image";
import { CalendarCheck, Check, Truck, Store, HeartHandshake, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";

type KindCard = {
  key: string;
  label: string;
  desc: string;
  Icon: React.ElementType;
  color: string;
  bg: string;
};

const CARDS: KindCard[] = [
  {
    key: "event",
    label: "イベント",
    desc: "イベントを探す",
    Icon: CalendarCheck,
    color: "#2f7d4e",
    bg: "#eef6f0",
  },
  {
    key: "kitchen",
    label: "キッチンカー",
    desc: "おいしい出会いを",
    Icon: Truck,
    color: "#d4843a",
    bg: "#fdf3e9",
  },
  {
    key: "store",
    label: "お店",
    desc: "お店を見つける",
    Icon: Store,
    color: "#4a78b8",
    bg: "#eef3fb",
  },
  {
    key: "volunteer",
    label: "ボランティア",
    desc: "役に立つ体験を",
    Icon: HeartHandshake,
    color: "#c05a7a",
    bg: "#fceef3",
  },
  {
    key: "game",
    label: "ゲーム",
    desc: "まちをめぐる",
    Icon: Gamepad2,
    color: "#2d7a4f",
    bg: "#e8f4ec",
  },
];

type Props = {
  activeChip: string;
  onChipClick: (key: string) => void;
};

/** まちの情報：種別への入口カード */
export function PcTownKindCards({ activeChip, onChipClick }: Props) {
  return (
    <section aria-label="種別から探す" className="grid grid-cols-5 gap-3">
      {CARDS.map(({ key, label, desc, Icon, color, bg }) => {
        const active = activeChip === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChipClick(key)}
            className={cn(
              "flex items-center gap-2.5 rounded-[14px] border bg-white px-3 py-3 text-left transition",
              active
                ? "border-[#e0b890] shadow-[0_4px_16px_rgba(160,100,40,0.12)]"
                : "border-[#e8ebe6] hover:border-[#d4b898] hover:shadow-[0_2px_10px_rgba(15,23,42,0.05)]",
            )}
          >
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
              style={{ background: bg, color }}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold text-[#1A2214]">
                {label}
              </span>
              <span className="mt-0.5 block text-[11px] leading-snug text-[#7a6a58]">
                {desc}
              </span>
            </span>
          </button>
        );
      })}
    </section>
  );
}

/**
 * モバイルの種別カードの絵と色。
 * イベント・お店・キッチンカー・ボランティアは掲載管理の水彩イラスト、ゲームはマスコットの絵を使う。
 */
const MOBILE_ART: Record<string, { src: string; en: string; tint: string; fit: "contain" | "cover" }> = {
  event: { src: "/organizer/listings/illust-event.png", en: "EVENT", tint: "#eef6ea", fit: "contain" },
  kitchen: { src: "/organizer/listings/illust-kitchen-car.png", en: "KITCHEN CAR", tint: "#fdf6e3", fit: "contain" },
  store: { src: "/organizer/listings/illust-store.png", en: "SHOP", tint: "#fdf0e8", fit: "contain" },
  volunteer: { src: "/organizer/listings/illust-volunteer.png", en: "VOLUNTEER", tint: "#eaf4f8", fit: "contain" },
  game: { src: "/organizer/games/game-type-stamp.png", en: "GAME", tint: "#e6f4ec", fit: "cover" },
};

/**
 * モバイル：種別入口カード（水彩イラストつき）。5つあるので横にスクロールさせ、
 * 右に続きがあると分かるよう3枚半ほど見せる（タブレットでは5つを並べる）。
 */
export function MobileTownKindCards({ activeChip, onChipClick }: Props) {
  return (
    <section
      aria-label="種別から探す"
      className="-mx-3 -my-2 flex snap-x scroll-px-3 gap-2.5 overflow-x-auto px-3 py-2 scrollbar-hide tablet:mx-0 tablet:grid tablet:grid-cols-5 tablet:gap-3 tablet:overflow-visible tablet:px-0"
    >
      {CARDS.map(({ key, label, color }) => {
        const active = activeChip === key;
        const art = MOBILE_ART[key];
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChipClick(key)}
            aria-pressed={active}
            className={cn(
              "relative flex w-[104px] shrink-0 snap-start flex-col overflow-hidden rounded-[20px] border text-left transition active:scale-[0.98] tablet:w-auto",
              active
                ? "border-[#2f7d4e] shadow-[0_6px_16px_rgba(22,56,40,0.18)] ring-2 ring-[#2f7d4e]/25"
                : "border-[#ebe6dc] shadow-[0_4px_12px_rgba(120,80,40,0.08)]",
            )}
            style={{ background: art?.tint ?? "#fff" }}
          >
            <span className="relative block h-[64px] w-full" aria-hidden>
              {art ? (
                <Image
                  src={art.src}
                  alt=""
                  fill
                  sizes="104px"
                  className={art.fit === "cover" ? "object-cover object-[50%_60%]" : "object-contain object-bottom px-1.5 pt-1.5"}
                />
              ) : null}
            </span>
            <span className="block w-full self-stretch border-t border-white bg-white px-2.5 pb-2 pt-1.5">
              <span className="block text-[8px] font-semibold tracking-[0.18em]" style={{ color }}>
                {art?.en}
              </span>
              <span className="block whitespace-nowrap text-[12.5px] font-bold leading-tight text-[#2a2218]">
                {label}
              </span>
            </span>
            {active ? (
              <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#2f7d4e] text-white" aria-hidden>
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            ) : null}
          </button>
        );
      })}
    </section>
  );
}
