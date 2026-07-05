"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { MapPin, ChevronRight } from "lucide-react";
import { PREFECTURES } from "@/lib/prefectures";
import { cn } from "@/lib/utils";

const FEATURED = ["東京都", "神奈川県", "埼玉県", "千葉県"] as const;

type Props = {
  selectedArea?: string;
  onSelectArea?: (area: string) => void;
  /** 親セクション内に埋め込む場合 */
  embedded?: boolean;
};

export function MobileRegionSection({ selectedArea, onSelectArea, embedded }: Props) {
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

  const content = (
    <>
      <div className="mb-1.5 flex items-center gap-1.5">
        <MapPin className="h-3.5 w-3.5 text-[#2f7d4e]" aria-hidden />
        <h2 className="mg-mobile-section-title">地域で探す</h2>
      </div>

      <div className="flex items-center gap-2">
        <div className="-mx-1 flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 scrollbar-hide">
          {chips.map((pref) => {
            const isAll = pref === "";
            const isSelected = (isAll && !activePref) || activePref === pref;
            const label = isAll ? "すべての地域" : pref;
            return (
              <button
                key={pref || "all"}
                type="button"
                onClick={() => selectPrefecture(pref)}
                className={cn(
                  "mg-mobile-chip",
                  isSelected ? "mg-mobile-chip-active" : "mg-mobile-chip-inactive"
                )}
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
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#dde9e1] bg-white"
            aria-label="もっと地域を見る"
          >
            <ChevronRight className="h-3.5 w-3.5 text-[#163828]" aria-hidden />
          </button>
        )}
      </div>
    </>
  );

  if (embedded) return content;

  return (
    <section aria-label="地域で探す" className="mg-mobile-section">
      {content}
    </section>
  );
}
