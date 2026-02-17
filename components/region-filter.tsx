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
  variant?: "compact" | "full";
};

export function RegionFilter({ className = "", variant = "full" }: Props) {
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
    },
    [router, pathname, searchParams]
  );

  const cities = prefecture ? (CITIES_BY_PREF[prefecture] ?? [{ id: "", name: "市区町村を選択" }]) : [];

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
