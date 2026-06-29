"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { MapPin, ChevronRight } from "lucide-react";
import { PREFECTURES } from "@/lib/prefectures";

const FEATURED = ["東京都", "神奈川県", "埼玉県", "千葉県"] as const;

type Props = {
  selectedArea?: string;
  onSelectArea?: (area: string) => void;
};

export function MobileRegionSection({ selectedArea, onSelectArea }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlPrefecture = searchParams.get("prefecture") ?? "";
  const [expanded, setExpanded] = useState(false);

  const activePref = onSelectArea !== undefined ? (selectedArea ?? "") : urlPrefecture;
  const chips: string[] = expanded ? ["", ...PREFECTURES] : ["", ...FEATURED];

  const selectPrefecture = (value: string) => {
    if (onSelectArea) {
      onSelectArea(value);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("prefecture", value);
    else params.delete("prefecture");
    params.delete("city");
    const qs = params.toString();
    router.push(pathname + (qs ? `?${qs}` : ""));
  };

  return (
    <section aria-label="地域で探す" className="space-y-2.5">
      <div className="flex items-center gap-1.5">
        <MapPin className="h-3.5 w-3.5 text-[#4a9a68]" aria-hidden />
        <h2 className="text-[13px] font-semibold text-[#0e1610]">地域で探す</h2>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto scrollbar-hide">
          {chips.map((pref) => {
            const isAll = pref === "";
            const isSelected = (isAll && !activePref) || activePref === pref;
            const label = isAll ? "すべての地域" : pref;
            return (
              <button
                key={pref || "all"}
                type="button"
                onClick={() => selectPrefecture(pref)}
                className={`inline-flex h-8 shrink-0 items-center rounded-full px-3.5 text-[11px] font-medium transition ${
                  isSelected
                    ? "bg-[#eef6f2] text-[#1e5848] ring-1 ring-[#b8dcc8]"
                    : "bg-white text-[#3d5c48] ring-1 ring-[#e3e8e4]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        {!expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-[#e3e8e4]"
            aria-label="もっと地域を見る"
          >
            <ChevronRight className="h-3.5 w-3.5 text-[#3d5c48]" aria-hidden />
          </button>
        )}
      </div>
    </section>
  );
}
