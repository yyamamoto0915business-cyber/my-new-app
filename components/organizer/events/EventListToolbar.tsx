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
  /** タブでステータス固定時はドロップダウンを無効化 */
  statusFilterDisabled?: boolean;
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
  statusFilterDisabled = false,
}: EventListToolbarProps) {
  const hasFilter = statusFilter !== "all";

  return (
    <div className="org-events-toolbar org-events-toolbar--embedded">
      <div className="flex flex-col gap-2 min-[900px]:flex-row min-[900px]:items-center min-[900px]:gap-3">
        <div className="org-events-toolbar__search-wrap relative min-w-0 flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa89c]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="イベント名で検索"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="org-events-toolbar__search"
            aria-label="イベント名で検索"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
            className="org-events-toolbar__select"
            aria-label="ステータスで絞り込み"
            disabled={statusFilterDisabled}
          >
            <option value="all">すべてのステータス</option>
            <option value="public">公開中</option>
            <option value="draft">下書き</option>
            <option value="ended">終了</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="org-events-toolbar__select"
            aria-label="並び替え"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => onStatusFilterChange("all")}
            className={`org-events-toolbar__filter-btn ${hasFilter ? "is-active" : ""}`}
            aria-pressed={hasFilter}
          >
            絞り込み
            {hasFilter ? (
              <span className="org-events-toolbar__filter-dot" aria-hidden />
            ) : null}
          </button>
        </div>
      </div>
    </div>
  );
}
