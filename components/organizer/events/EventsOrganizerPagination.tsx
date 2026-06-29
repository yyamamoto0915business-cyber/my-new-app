"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE_OPTIONS = [5, 10, 20] as const;

type Props = {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

export function EventsOrganizerPagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: Props) {
  if (totalItems === 0) return null;

  const pages = pageNumbers(currentPage, totalPages);
  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="org-events-pagination">
      <p className="org-events-pagination__meta">
        {totalItems}件中 {from}–{to}件を表示
      </p>

      {totalPages > 1 ? (
        <nav className="org-events-pagination__pages" aria-label="ページネーション">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="org-events-pagination__nav-btn"
            aria-label="前のページ"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`ellipsis-${i}`} className="px-1 text-[12px] text-[#9aa89c]">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`org-events-pagination__page ${
                  currentPage === p ? "is-active" : ""
                }`}
                aria-current={currentPage === p ? "page" : undefined}
              >
                {p}
              </button>
            )
          )}

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="org-events-pagination__nav-btn"
            aria-label="次のページ"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      ) : (
        <div className="hidden min-[900px]:block" aria-hidden />
      )}

      <label className="org-events-pagination__size">
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="org-events-pagination__size-select"
          aria-label="表示件数"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}件ずつ表示
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
