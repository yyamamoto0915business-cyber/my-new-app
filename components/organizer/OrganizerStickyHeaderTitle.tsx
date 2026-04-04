"use client";

import { usePathname } from "next/navigation";

/**
 * スマホでは登録導線ページのヘッダーを薄くし、本文の見出しを主役にする。
 */
export function OrganizerStickyHeaderTitle() {
  const pathname = usePathname() ?? "";
  const p = pathname.replace(/\/$/, "") || "/";
  const liteMobile =
    p === "/organizer" || p.startsWith("/organizer/register");

  if (liteMobile) {
    return (
      <div className="min-w-0">
        <p className="truncate text-xs font-medium tracking-wide text-slate-500 sm:hidden">
          主催者向け
        </p>
        <div className="hidden sm:block">
          <div className="truncate text-lg font-bold tracking-[-0.02em] text-slate-900">
            主催者管理
          </div>
          <div className="mt-0.5 truncate text-xs text-slate-500">
            イベントの作成・編集・管理ができます
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <div className="truncate text-[15px] font-semibold tracking-[-0.02em] text-slate-600 sm:text-lg sm:font-bold sm:text-slate-900">
        主催者管理
      </div>
      <div className="hidden truncate text-xs text-slate-500 sm:block">
        イベントの作成・編集・管理ができます
      </div>
    </div>
  );
}
