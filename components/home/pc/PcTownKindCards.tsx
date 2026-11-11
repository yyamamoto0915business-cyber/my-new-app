"use client";

import { CalendarCheck, Truck, Store, HeartHandshake, Gamepad2 } from "lucide-react";
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

/** モバイルの種別カードの下線の色（見本：イベント緑・キッチンカー黄・お店朱・ボランティア水色） */
const MOBILE_UNDERLINE: Record<string, string> = {
  event: "#bfe0b0",
  kitchen: "#f3df86",
  store: "#f6b9a4",
  volunteer: "#b5dbf0",
  game: "#d5c6ef",
};

/**
 * モバイル：種別入口カード。5つあるので横にスクロールさせ、
 * 右に続きがあると分かるよう4枚半ほど見せる（タブレットでは5つを並べる）。
 */
export function MobileTownKindCards({ activeChip, onChipClick }: Props) {
  return (
    <section
      aria-label="種別から探す"
      className="-mx-3 -my-2 flex snap-x scroll-px-3 gap-2 overflow-x-auto px-3 py-2 scrollbar-hide tablet:mx-0 tablet:grid tablet:grid-cols-5 tablet:gap-3 tablet:overflow-visible tablet:px-0"
    >
      {CARDS.map(({ key, label, Icon }) => {
        const active = activeChip === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChipClick(key)}
            aria-pressed={active}
            className={cn(
              "flex w-[80px] shrink-0 snap-start flex-col items-center gap-1.5 rounded-[18px] border px-1 pb-2.5 pt-3 text-center transition active:scale-[0.98] tablet:w-auto",
              active
                ? "border-[#2f7d4e] bg-[#f1f8f2] shadow-[0_4px_12px_rgba(22,56,40,0.12)]"
                : "border-[#ebeee8] bg-white shadow-[0_3px_10px_rgba(22,56,40,0.06)]",
            )}
          >
            <Icon className="h-7 w-7 text-[#1f5e3a]" strokeWidth={1.8} aria-hidden />
            <span className="block whitespace-nowrap text-[11px] font-bold leading-tight text-[#163828] tablet:text-[13px]">
              {label}
            </span>
            <span
              className="h-[5px] w-[70%] rounded-full"
              style={{ background: MOBILE_UNDERLINE[key] ?? "#e3ece5" }}
              aria-hidden
            />
          </button>
        );
      })}
    </section>
  );
}
