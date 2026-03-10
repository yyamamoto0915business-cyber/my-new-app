"use client";

export type SortOption = "date_asc" | "date_desc" | "created_desc";
export type StatusFilter = "all" | "public" | "draft" | "ended";

type EventListToolbarProps = {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (v: StatusFilter) => void;
  sortBy: SortOption;
  onSortChange: (v: SortOption) => void;
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "date_asc", label: "開催日が近い順" },
  { value: "date_desc", label: "開催日が遠い順" },
  { value: "created_desc", label: "新しく作成した順" },
];

export function EventListToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
}: EventListToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="min-w-0 flex-1">
        <input
          type="search"
          placeholder="イベント名で検索"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200/50"
          aria-label="イベント名で検索"
        />
      </div>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
          className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200/50"
          aria-label="ステータスで絞り込み"
        >
          <option value="all">すべて</option>
          <option value="public">公開中</option>
          <option value="draft">下書き</option>
          <option value="ended">終了</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200/50"
          aria-label="並び替え"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
