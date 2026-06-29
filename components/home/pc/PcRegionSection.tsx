"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { MapPin, ChevronDown } from "lucide-react";
import { PREFECTURES } from "@/lib/prefectures";

const FEATURED_PREFECTURES = [
  "東京都",
  "神奈川県",
  "埼玉県",
  "千葉県",
  "大阪府",
  "愛知県",
  "福岡県",
  "北海道",
  "京都府",
  "兵庫県",
  "広島県",
  "宮城県",
] as const;

type Props = {
  compact?: boolean;
  selectedArea?: string;
  onSelectArea?: (area: string) => void;
};

export function PcRegionSection({ compact = false, selectedArea, onSelectArea }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlPrefecture = searchParams.get("prefecture") ?? "";
  const [expanded, setExpanded] = useState(false);

  // onSelectArea が渡された場合はコールバックモード、それ以外はURLモード
  const activePref = onSelectArea !== undefined ? (selectedArea ?? "") : urlPrefecture;

  const visible: string[] = expanded
    ? ["", ...PREFECTURES]
    : ["", ...FEATURED_PREFECTURES];

  const handleSelect = (value: string) => {
    if (onSelectArea) {
      onSelectArea(value);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("prefecture", value);
      else params.delete("prefecture");
      params.delete("city");
      const qs = params.toString();
      router.push(pathname + (qs ? `?${qs}` : ""));
    }
  };

  return (
    <section aria-label="地域で探す" className={compact ? "min-w-0" : "space-y-3"}>
      <div className="mb-2 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-[#4a9a68]" aria-hidden />
        <h2 className="text-[14px] font-semibold text-[#0e1610]">地域で探す</h2>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {visible.map((pref) => {
          const isAll = pref === "";
          const isSelected = (isAll && !activePref) || activePref === pref;
          const label = isAll ? "すべての地域" : pref;
          return (
            <button
              key={pref || "all"}
              type="button"
              onClick={() => handleSelect(pref)}
              className={`inline-flex items-center rounded-full font-medium transition ${
                compact ? "h-7 px-3 text-[11px]" : "h-9 px-4 text-[12px]"
              } ${
                isSelected
                  ? isAll
                    ? "bg-[#1a2b3c] text-white shadow-sm"
                    : "bg-[#eef6f2] text-[#1e5848] ring-1 ring-[#b8dcc8]"
                  : "bg-[#fafaf8] text-[#3d5c48] ring-1 ring-[#e3e8e4] hover:ring-[#c8dcd0]"
              }`}
            >
              {label}
            </button>
          );
        })}
        {!expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className={`inline-flex items-center gap-0.5 rounded-full bg-[#fafaf8] font-medium text-[#3d5c48] ring-1 ring-[#e3e8e4] hover:ring-[#c8dcd0] ${
              compact ? "h-7 px-3 text-[11px]" : "h-9 px-4 text-[12px]"
            }`}
          >
            もっと見る
            <ChevronDown className="h-3 w-3" aria-hidden />
          </button>
        )}
      </div>
    </section>
  );
}
