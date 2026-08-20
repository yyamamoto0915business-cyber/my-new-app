"use client";

import { CalendarCheck, Truck, Store, HeartHandshake, ChevronRight } from "lucide-react";
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
    desc: "地域のイベントを探す",
    Icon: CalendarCheck,
    color: "#2f7d4e",
    bg: "#eef6f0",
  },
  {
    key: "kitchen",
    label: "キッチンカー",
    desc: "おいしい出会いを探す",
    Icon: Truck,
    color: "#d4843a",
    bg: "#fdf3e9",
  },
  {
    key: "store",
    label: "お店",
    desc: "すてきなお店を見つける",
    Icon: Store,
    color: "#4a78b8",
    bg: "#eef3fb",
  },
  {
    key: "volunteer",
    label: "ボランティア募集",
    desc: "誰かの役に立つ体験を",
    Icon: HeartHandshake,
    color: "#c05a7a",
    bg: "#fceef3",
  },
];

type Props = {
  activeChip: string;
  onChipClick: (key: string) => void;
};

/** まちの情報：4種別への入口カード */
export function PcTownKindCards({ activeChip, onChipClick }: Props) {
  return (
    <section aria-label="種別から探す" className="grid grid-cols-4 gap-3">
      {CARDS.map(({ key, label, desc, Icon, color, bg }) => {
        const active = activeChip === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChipClick(key)}
            className={cn(
              "group flex items-center gap-3 rounded-[14px] border bg-white px-4 py-3.5 text-left transition",
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
              <span className="mt-0.5 block truncate text-[11px] text-[#7a6a58]">
                {desc}
              </span>
            </span>
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white transition group-hover:translate-x-0.5"
              style={{ background: color }}
              aria-hidden
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </button>
        );
      })}
    </section>
  );
}

/** モバイル：1行4列の種別入口カード */
export function MobileTownKindCards({ activeChip, onChipClick }: Props) {
  return (
    <section aria-label="種別から探す" className="grid grid-cols-4 gap-1.5">
      {CARDS.map(({ key, label, Icon, color, bg }) => {
        const active = activeChip === key;
        const shortLabel = key === "volunteer" ? "ボランティア" : label;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChipClick(key)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-[12px] border px-1 py-2 text-center transition",
              active
                ? "border-[#dcc4a0] bg-gradient-to-b from-[#fdf8ee] to-[#faf2e4] shadow-[0_2px_6px_rgba(150,100,40,0.10)]"
                : "border-[#ebe3d6] bg-white shadow-[0_1px_3px_rgba(120,80,40,0.05)] active:bg-[#fdfbf6]",
            )}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ring-white/70 shadow-[0_1px_2px_rgba(120,80,40,0.06)]"
              style={{ background: bg, color }}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="block text-[10px] font-semibold leading-tight tracking-[0.02em] text-[#1A2214]">
              {shortLabel}
            </span>
          </button>
        );
      })}
    </section>
  );
}
