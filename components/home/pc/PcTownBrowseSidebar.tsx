"use client";

import { CalendarDays, Flag, HeartHandshake, Store, Truck, MapPin, JapaneseYen, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TownTimeRange } from "@/components/home/pc/PcTownFilterBar";
import type { BrowsePriceFilter } from "@/components/home/pc/town-browse";

type KindKey = "all" | "event" | "kitchen" | "store" | "volunteer" | "game";

type KindCounts = Record<KindKey, number>;

type AreaCount = { label: string; count: number };

type Props = {
  activeKind: string;
  onKindChange: (key: string) => void;
  counts: KindCounts;
  timeRange: TownTimeRange;
  onTimeRangeChange: (value: TownTimeRange) => void;
  specificDate: string;
  onSpecificDateChange: (value: string) => void;
  weekendLabel: string;
  nextWeekLabel: string;
  monthLabel: string;
  areas: AreaCount[];
  selectedArea: string;
  onAreaChange: (area: string) => void;
  priceFilter: BrowsePriceFilter;
  onPriceFilterChange: (value: BrowsePriceFilter) => void;
  freeCount: number;
  paidCount: number;
};

const KINDS: {
  key: KindKey;
  label: string;
  Icon: React.ElementType;
}[] = [
  { key: "all", label: "すべて", Icon: CalendarDays },
  { key: "event", label: "イベント", Icon: Flag },
  { key: "kitchen", label: "キッチンカー", Icon: Truck },
  { key: "store", label: "お店", Icon: Store },
  { key: "volunteer", label: "ボランティア", Icon: HeartHandshake },
  { key: "game", label: "ゲーム", Icon: Gamepad2 },
];

function CountRow({
  active,
  label,
  count,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex w-full items-center gap-2 rounded-full px-2.5 py-1 text-left text-[13px] transition",
        active
          ? "bg-[#e5f3e8] font-semibold text-[#1f6b3a]"
          : "text-[#3d4a40] hover:bg-[#f4f7f2]",
      )}
    >
      {icon ? <span className="text-[#6a8a72]">{icon}</span> : null}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count != null ? (
        <span className={cn("text-[12px] tabular-nums", active ? "text-[#2f7d4e]" : "text-[#8a978c]")}>
          {count}
        </span>
      ) : null}
    </button>
  );
}

function RadioRow({
  name,
  checked,
  label,
  hint,
  onChange,
}: {
  name: string;
  checked: boolean;
  label: string;
  hint?: string;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 py-0.5 text-[13px] text-[#3d4a40]">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 accent-[#2f7d4e]"
      />
      <span className="min-w-0 flex-1">
        {label}
        {hint ? <span className="ml-1 text-[11px] text-[#8a978c]">（{hint}）</span> : null}
      </span>
    </label>
  );
}

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h3 className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#1e3d2c]">
      {icon}
      {children}
    </h3>
  );
}

/** まちの情報PC：左の種別・開催日・エリア・料金 */
export function PcTownBrowseSidebar({
  activeKind,
  onKindChange,
  counts,
  timeRange,
  onTimeRangeChange,
  specificDate,
  onSpecificDateChange,
  weekendLabel,
  nextWeekLabel,
  monthLabel,
  areas,
  selectedArea,
  onAreaChange,
  priceFilter,
  onPriceFilterChange,
  freeCount,
  paidCount,
}: Props) {
  return (
    <aside className="sticky top-[calc(var(--mg-pc-top-nav-h)+12px)] w-[212px] shrink-0 self-start rounded-[18px] border border-[#e3ebe4] bg-white px-3 py-3 shadow-[0_1px_4px_rgba(22,40,28,0.04)]">
      <SectionLabel icon={<CalendarDays className="h-4 w-4 text-[#2f7d4e]" aria-hidden />}>
        まちの情報
      </SectionLabel>
      <div className="space-y-0.5">
        {KINDS.map(({ key, label, Icon }) => (
          <CountRow
            key={key}
            active={activeKind === key}
            label={label}
            count={counts[key]}
            icon={key === "all" ? undefined : <Icon className="h-3.5 w-3.5" aria-hidden />}
            onClick={() => onKindChange(key)}
          />
        ))}
      </div>

      <div className="my-2 h-px bg-[#eef2ee]" />

      <SectionLabel icon={<CalendarDays className="h-4 w-4 text-[#2f7d4e]" aria-hidden />}>
        開催日
      </SectionLabel>
      <div className="pl-0.5">
        <RadioRow name="town-date" checked={timeRange === "all"} label="すべて" onChange={() => onTimeRangeChange("all")} />
        <RadioRow
          name="town-date"
          checked={timeRange === "weekend"}
          label="今週末"
          hint={weekendLabel}
          onChange={() => onTimeRangeChange("weekend")}
        />
        <RadioRow
          name="town-date"
          checked={timeRange === "next_week"}
          label="来週"
          hint={nextWeekLabel}
          onChange={() => onTimeRangeChange("next_week")}
        />
        <RadioRow
          name="town-date"
          checked={timeRange === "month"}
          label="今月"
          hint={monthLabel}
          onChange={() => onTimeRangeChange("month")}
        />
        <RadioRow
          name="town-date"
          checked={timeRange === "date"}
          label="日付を指定"
          onChange={() => onTimeRangeChange("date")}
        />
        {timeRange === "date" ? (
          <input
            type="date"
            value={specificDate}
            onChange={(e) => onSpecificDateChange(e.target.value)}
            className="mt-1 h-8 w-full rounded-[8px] border border-[#d7e3d8] bg-[#f7faf7] px-2 text-[12px] text-[#1e3d2c] outline-none focus:border-[#2f7d4e]"
            aria-label="開催日を指定"
          />
        ) : null}
      </div>

      <div className="my-2 h-px bg-[#eef2ee]" />

      <SectionLabel icon={<MapPin className="h-4 w-4 text-[#2f7d4e]" aria-hidden />}>
        エリア
      </SectionLabel>
      <div className="space-y-0.5">
        <CountRow
          active={selectedArea === ""}
          label="すべて"
          onClick={() => onAreaChange("")}
        />
        {areas.map((area) => (
          <CountRow
            key={area.label}
            active={selectedArea === area.label}
            label={area.label.replace(/(都|道|府|県)$/, "")}
            count={area.count}
            onClick={() => onAreaChange(area.label)}
          />
        ))}
      </div>

      <div className="my-2 h-px bg-[#eef2ee]" />

      <SectionLabel icon={<JapaneseYen className="h-4 w-4 text-[#2f7d4e]" aria-hidden />}>
        料金
      </SectionLabel>
      <div className="pl-0.5">
        <RadioRow name="town-price" checked={priceFilter === "all"} label="すべて" onChange={() => onPriceFilterChange("all")} />
        <RadioRow
          name="town-price"
          checked={priceFilter === "free"}
          label="無料"
          hint={String(freeCount)}
          onChange={() => onPriceFilterChange("free")}
        />
        <RadioRow
          name="town-price"
          checked={priceFilter === "paid"}
          label="有料"
          hint={String(paidCount)}
          onChange={() => onPriceFilterChange("paid")}
        />
      </div>
    </aside>
  );
}
