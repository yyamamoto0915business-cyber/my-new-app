"use client";

import type { MapBoundsState } from "./types";

type Props = {
  visible: boolean;
  isSearching?: boolean;
  onClick: (bounds: MapBoundsState) => void;
  bounds: MapBoundsState | null;
  topPx?: number;
};

export function SearchThisAreaButton({
  visible,
  isSearching = false,
  onClick,
  bounds,
  topPx = 96,
}: Props) {
  if (!bounds) return null;

  return (
    <div
      className={`absolute left-0 right-0 z-[1000] flex justify-center px-3 transition-all duration-200 ease-out ${
        visible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-1 pointer-events-none"
      }`}
      style={{ top: topPx }}
    >
      <button
        type="button"
        onClick={() => onClick(bounds)}
        disabled={isSearching}
        className="flex h-[44px] w-full max-w-[420px] items-center justify-center gap-2 rounded-full border border-zinc-200/70 bg-white/95 px-5 text-sm font-semibold shadow-sm backdrop-blur disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900/90"
      >
        {isSearching ? "再検索中..." : "このエリアで再検索"}
      </button>
    </div>
  );
}

