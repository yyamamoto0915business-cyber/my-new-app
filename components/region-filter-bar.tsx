"use client";

import { RegionFilter } from "./region-filter";

/**
 * 上部常駐の地域フィルターバー。
 * layout または各ページヘッダーに配置する。
 */
export function RegionFilterBar() {
  return (
    <div className="border-b border-zinc-200/60 bg-white/90 px-4 py-3 backdrop-blur-sm dark:border-zinc-700/60 dark:bg-zinc-900/90">
      <div className="mx-auto flex max-w-6xl items-center gap-4">
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          地域で絞り込み
        </span>
        <RegionFilter variant="full" />
      </div>
    </div>
  );
}
