"use client";

import { RegionFilter } from "./region-filter";
import { LanguageSwitcher } from "./language-switcher";

/**
 * 上部常駐の地域フィルターバー。
 * layout または各ページヘッダーに配置する。
 */
export function RegionFilterBar() {
  return (
    <div className="border-b border-zinc-200/60 bg-white/90 px-4 py-3 backdrop-blur-sm dark:border-zinc-700/60 dark:bg-zinc-900/90">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="shrink-0 text-sm text-zinc-500 dark:text-zinc-400">地域</span>
          <RegionFilter variant="full" />
        </div>
        <LanguageSwitcher />
      </div>
    </div>
  );
}
