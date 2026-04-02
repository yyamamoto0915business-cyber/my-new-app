"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

// 都道府県一覧（主要なもの）
const PREFECTURES = [
  { id: "", name: "すべての地域" },
  { id: "東京都", name: "東京都" },
  { id: "大阪府", name: "大阪府" },
  { id: "北海道", name: "北海道" },
  { id: "福岡県", name: "福岡県" },
  { id: "愛知県", name: "愛知県" },
  { id: "神奈川県", name: "神奈川県" },
  { id: "埼玉県", name: "埼玉県" },
  { id: "千葉県", name: "千葉県" },
  { id: "京都府", name: "京都府" },
];

// 市区町村（東京都の例、他県は空で動的取得想定）
const CITIES_BY_PREF: Record<string, { id: string; name: string }[]> = {
  東京都: [
    { id: "", name: "市区町村を選択" },
    { id: "渋谷区", name: "渋谷区" },
    { id: "新宿区", name: "新宿区" },
    { id: "港区", name: "港区" },
    { id: "中央区", name: "中央区" },
  ],
};

type Props = {
  className?: string;
  variant?: "compact" | "full" | "pill" | "chips";
  onRegionChange?: (prefecture: string, city: string) => void;
};

export function RegionFilter({ className = "", variant = "full", onRegionChange }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prefecture = searchParams.get("prefecture") ?? "";
  const city = searchParams.get("city") ?? "";

  const updateParams = useCallback(
    (updates: { prefecture?: string; city?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (updates.prefecture !== undefined) {
        if (updates.prefecture) params.set("prefecture", updates.prefecture);
        else params.delete("prefecture");
        params.delete("city");
      }
      if (updates.city !== undefined) {
        if (updates.city) params.set("city", updates.city);
        else params.delete("city");
      }
      const qs = params.toString();
      router.push(pathname + (qs ? `?${qs}` : ""));
      const newPref = updates.prefecture ?? prefecture;
      const newCity = updates.city ?? (updates.prefecture !== undefined ? "" : city);
      onRegionChange?.(newPref, newCity);
    },
    [router, pathname, searchParams, prefecture, city, onRegionChange]
  );

  const cities = prefecture ? (CITIES_BY_PREF[prefecture] ?? [{ id: "", name: "市区町村を選択" }]) : [];

  if (variant === "chips") {
    return (
      <div className={`flex gap-2 overflow-x-auto pb-1 scrollbar-hide ${className}`}>
        {PREFECTURES.map((p) => {
          const isSelected = (p.id === "" && !prefecture) || prefecture === p.id;
          return (
            <button
              key={p.id || "all"}
              type="button"
              onClick={() => updateParams({ prefecture: p.id })}
              className={`h-10 shrink-0 rounded-full px-4 text-sm font-medium transition-all whitespace-nowrap border ${
                isSelected
                  ? "border-green-100 bg-green-50 text-green-700"
                  : "border-slate-200 bg-white text-slate-600 active:bg-slate-50"
              }`}
            >
              {p.name}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === "pill") {
    return (
      <div className={`relative max-w-[160px] shrink-0 sm:max-w-none ${className}`}>
        <select
          value={prefecture}
          onChange={(e) => updateParams({ prefecture: e.target.value })}
          className="min-h-[44px] min-w-[44px] cursor-pointer appearance-none rounded-full border border-[var(--border)] bg-white/90 px-4 pr-8 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-white dark:bg-[var(--background)] dark:text-zinc-100 dark:hover:bg-zinc-800"
          aria-label="地域を選択"
        >
          <option value="">すべての地域</option>
          {PREFECTURES.filter((p) => p.id).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <span
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
          aria-hidden
        >
          ▾
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <select
        value={prefecture}
        onChange={(e) => updateParams({ prefecture: e.target.value })}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
      >
        {PREFECTURES.map((p) => (
          <option key={p.id || "all"} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      {cities.length > 1 && (
        <select
          value={city}
          onChange={(e) => updateParams({ city: e.target.value })}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        >
          {cities.map((c) => (
            <option key={c.id || "all"} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}
      {(prefecture || city) && variant === "full" && (
        <button
          type="button"
          onClick={() => updateParams({ prefecture: "", city: "" })}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          クリア
        </button>
      )}
    </div>
  );
}
