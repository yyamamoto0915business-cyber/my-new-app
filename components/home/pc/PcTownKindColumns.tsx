"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CalendarCheck, Truck, Store, HeartHandshake } from "lucide-react";
import type { Event } from "@/lib/db/types";
import type { StoreRecord } from "@/lib/stores/types";
import type { VolunteerRoleWithEvent } from "@/lib/volunteer-utils";
import {
  eventsToMachiItems,
  storeToMachiItem,
  volunteerToMachiItem,
  type MachiFeedItem,
} from "@/lib/machi/feed";

type Props = {
  events: Event[];
  stores: StoreRecord[];
  volunteers: VolunteerRoleWithEvent[];
  loading: boolean;
  includeEnded: boolean;
  onChipClick: (key: string) => void;
};

type ColumnDef = {
  key: string;
  label: string;
  Icon: React.ElementType;
  color: string;
};

const COLUMNS: ColumnDef[] = [
  { key: "event", label: "イベント", Icon: CalendarCheck, color: "#2f7d4e" },
  { key: "kitchen", label: "キッチンカー", Icon: Truck, color: "#d4843a" },
  { key: "store", label: "お店", Icon: Store, color: "#4a78b8" },
  { key: "volunteer", label: "ボランティア募集", Icon: HeartHandshake, color: "#c05a7a" },
];

function ColumnRow({ item }: { item: MachiFeedItem }) {
  return (
    <Link
      href={item.href}
      className="flex items-center gap-2.5 rounded-[10px] py-1.5 transition hover:bg-[#faf7f2]"
    >
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[8px] bg-[#f3ebe3]">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[8px] font-medium text-[#9a7a58]">
            {item.kindLabel}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-semibold text-[#1A2214]">
          {item.title}
        </p>
        <p className="truncate text-[10px] text-[#8a7a68]">
          {item.metaLabel ? `${item.metaLabel}・` : ""}
          {item.areaLabel}
        </p>
      </div>
    </Link>
  );
}

/** まちの情報：種別ごとの4カラム（各2件＋すべて見る） */
export function PcTownKindColumns({
  events,
  stores,
  volunteers,
  loading,
  includeEnded,
  onChipClick,
}: Props) {
  const byKind = useMemo(() => {
    const eventItems = eventsToMachiItems(events, includeEnded).slice(0, 2);
    const kitchenItems = stores
      .filter((s) => s.kind === "kitchen_car")
      .map(storeToMachiItem)
      .sort((a, b) => b.sortAt - a.sortAt)
      .slice(0, 2);
    const storeItems = stores
      .filter((s) => s.kind !== "kitchen_car")
      .map(storeToMachiItem)
      .sort((a, b) => b.sortAt - a.sortAt)
      .slice(0, 2);
    const volunteerItems = volunteers
      .map(volunteerToMachiItem)
      .sort((a, b) => b.sortAt - a.sortAt)
      .slice(0, 2);
    return {
      event: eventItems,
      kitchen: kitchenItems,
      store: storeItems,
      volunteer: volunteerItems,
    } as Record<string, MachiFeedItem[]>;
  }, [events, stores, volunteers, includeEnded]);

  return (
    <section
      aria-label="種別ごとの新着"
      className="grid grid-cols-4 gap-3 rounded-[16px] border border-[#ebe4dc] bg-white p-4 shadow-[0_1px_4px_rgba(15,23,42,0.03)]"
    >
      {COLUMNS.map(({ key, label, Icon, color }) => {
        const items = byKind[key] ?? [];
        return (
          <div key={key} className="min-w-0">
            <div className="mb-1.5 flex items-center justify-between gap-1">
              <div className="flex min-w-0 items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} aria-hidden />
                <h3 className="truncate text-[12.5px] font-semibold text-[#1A2214]">
                  {label}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onChipClick(key)}
                className="shrink-0 text-[10.5px] font-medium text-[#9a8a78] transition hover:text-[#b56a2e]"
              >
                すべて見る →
              </button>
            </div>
            <div className="border-t border-[#f2ede6] pt-0.5">
              {loading ? (
                <div className="space-y-2 py-1">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-10 animate-pulse rounded-[8px] bg-[#f3ebe3]" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <p className="py-3 text-[10.5px] text-[#a89a88]">まだありません</p>
              ) : (
                <div className="divide-y divide-[#f5f0e9]">
                  {items.map((item) => (
                    <ColumnRow key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
