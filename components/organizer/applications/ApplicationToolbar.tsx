"use client";

export type StatusFilter = "all" | "pending" | "accepted" | "rejected";
export type SortOption = "created_asc" | "created_desc" | "name_asc";

type ApplicationToolbarProps = {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (v: StatusFilter) => void;
  sortBy: SortOption;
  onSortChange: (v: SortOption) => void;
  resultCount: number;
  hasFilter: boolean;
  onReset: () => void;
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "created_asc", label: "申込が古い順" },
  { value: "created_desc", label: "申込が新しい順" },
  { value: "name_asc", label: "名前順" },
];

export function ApplicationToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
  resultCount,
  hasFilter,
  onReset,
}: ApplicationToolbarProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-slate-500">検索・絞り込み</p>
        <p className="text-xs text-slate-500">
          表示 <span className="font-semibold text-slate-700">{resultCount}</span> 件
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="min-w-0 flex-1">
          <input
            type="search"
            placeholder="名前・メール・メッセージで検索"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200/50"
            aria-label="キーワード検索"
          />
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:gap-3">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
            className="min-w-0 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200/50"
            aria-label="ステータスで絞り込み"
          >
            <option value="all">すべて</option>
            <option value="pending">未確認</option>
            <option value="accepted">承認済み</option>
            <option value="rejected">却下</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="min-w-0 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200/50"
            aria-label="並び替え"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {hasFilter && (
            <button
              type="button"
              onClick={onReset}
              className="col-span-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 sm:col-span-1"
            >
              条件をリセット
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
