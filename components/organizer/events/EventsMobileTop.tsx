"use client";

import Link from "next/link";
import { Archive, ArrowUpDown, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORG_SERIF, OrgEyebrow } from "@/components/organizer/mobile/organizer-theme";
import type { EventListTab } from "@/components/organizer/events/EventListFilterTabs";
import type { SortOption } from "@/components/organizer/events/EventListToolbar";

const TABS: { id: Exclude<EventListTab, "archived">; label: string }[] = [
  { id: "all", label: "すべて" },
  { id: "public", label: "公開中" },
  { id: "draft", label: "下書き" },
  { id: "ended", label: "終了" },
];

const SORT_LABELS: Record<SortOption, string> = {
  date_asc: "開催日が近い順",
  date_desc: "開催日が遠い順",
  created_desc: "新しく作った順",
};

type Props = {
  total: number;
  counts: Record<EventListTab, number>;
  listTab: EventListTab;
  onTabChange: (tab: EventListTab) => void;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  sortBy: SortOption;
  onSortChange: (v: SortOption) => void;
  archivedCount: number;
  onArchiveClick: () => void;
};

/**
 * イベント管理（スマホ・タブレット）の上の部分。
 * 見出し1行（右に「＋ 作成」）→ 状態のタブ（件数つき・スクロールしても上に残る）→ 検索と並び替え・アーカイブ。
 * 4つの大きな数字の箱と「すべてのステータス」の選択は、タブと重なるのでスマホでは出さない。
 */
export function EventsMobileTop({
  total,
  counts,
  listTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  archivedCount,
  onArchiveClick,
}: Props) {
  const archiveActive = listTab === "archived";
  return (
    <div className="min-[900px]:hidden">
      <header className="flex items-end justify-between gap-3 pt-1">
        <div className="min-w-0">
          <OrgEyebrow>EVENTS</OrgEyebrow>
          <h1
            className="mt-0.5 flex items-baseline gap-2 text-[22px] font-bold tracking-[0.04em] text-[#163828]"
            style={{ fontFamily: ORG_SERIF }}
          >
            イベント管理
            <span className="font-sans text-[13px] font-bold tracking-normal text-[#6b776f]">{total}件</span>
          </h1>
        </div>
        <Link
          href="/organizer/events/new"
          className="inline-flex h-10 shrink-0 items-center gap-1 rounded-full border-[1.5px] border-[#d9bc6e] bg-gradient-to-b from-[#245a3e] to-[#173f2c] px-3.5 text-[13px] font-bold text-[#f6ebc8] shadow-[0_4px_12px_rgba(14,42,29,0.22)]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          作成
        </Link>
      </header>

      {/* 状態のタブ・検索は、スクロールしても上に残す */}
      <div className="sticky top-[calc(var(--mg-mobile-top-header-h,52px)+env(safe-area-inset-top,0px))] z-10 -mx-4 mt-3 space-y-2 bg-white/70 px-4 pb-2.5 pt-2 backdrop-blur-md">
        <div role="tablist" aria-label="イベントの状態" className="flex gap-1 rounded-full bg-[#eef3ef] p-1">
          {TABS.map((t) => {
            const active = listTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onTabChange(t.id)}
                className={cn(
                  "flex min-h-[36px] flex-1 items-center justify-center gap-1 rounded-full text-[12.5px] font-bold transition",
                  active ? "bg-[#173f2c] text-[#f3e6bf] shadow-[0_3px_8px_rgba(14,42,29,0.25)]" : "text-[#5f6d64]"
                )}
              >
                {t.label}
                <span
                  className={cn(
                    "min-w-[18px] rounded-full px-1 text-[10.5px] leading-[16px]",
                    active ? "bg-[#c9a54e] text-[#0e2a1d]" : "bg-[#dfe8e1] text-[#5f6d64]"
                  )}
                >
                  {counts[t.id]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-[12px] border border-[#e3ece5] bg-white px-3">
            <Search className="h-4 w-4 shrink-0 text-[#8a958d]" aria-hidden />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="イベント名で検索"
              aria-label="イベント名で検索"
              className="min-w-0 flex-1 bg-transparent text-[16px] text-[#163828] outline-none placeholder:text-[13.5px] placeholder:text-[#9aa49d]"
            />
          </label>
          {/* 並び替え：見た目は小さいボタン、上に透明の select（iPhone で拡大されないよう 16px） */}
          <span className="relative inline-flex h-10 shrink-0 items-center gap-1 rounded-[12px] border border-[#e3ece5] bg-white px-2.5 text-[12px] font-bold text-[#2f4a3a]">
            <ArrowUpDown className="h-3.5 w-3.5" aria-hidden />
            {SORT_LABELS[sortBy].replace("開催日が", "")}
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              aria-label="並び替え"
              className="absolute inset-0 cursor-pointer opacity-0 text-[16px]"
            >
              {(Object.keys(SORT_LABELS) as SortOption[]).map((k) => (
                <option key={k} value={k}>
                  {SORT_LABELS[k]}
                </option>
              ))}
            </select>
          </span>
          {archivedCount > 0 || archiveActive ? (
            <button
              type="button"
              onClick={onArchiveClick}
              aria-pressed={archiveActive}
              aria-label={`アーカイブ ${archivedCount}件`}
              className={cn(
                "relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border",
                archiveActive ? "border-[#173f2c] bg-[#173f2c] text-[#f3e6bf]" : "border-[#e3ece5] bg-white text-[#5f6d64]"
              )}
            >
              <Archive className="h-4 w-4" aria-hidden />
              <span className="absolute -right-1 -top-1 min-w-[16px] rounded-full bg-[#c9a54e] px-1 text-[9.5px] font-bold leading-[16px] text-[#0e2a1d]">
                {archivedCount}
              </span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
