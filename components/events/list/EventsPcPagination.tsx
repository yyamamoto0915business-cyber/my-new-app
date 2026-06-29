"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLoadMore: () => void;
  hasMore: boolean;
};

export function EventsPcPagination({
  currentPage,
  totalPages,
  onPageChange,
  onLoadMore,
  hasMore,
}: Props) {
  const pages = useMemoPageNumbers(currentPage, totalPages);

  return (
    <div className="mt-3 space-y-3">
      {hasMore ? (
        <button
          type="button"
          onClick={onLoadMore}
          className="flex h-9 w-full items-center justify-center gap-1 rounded-[10px] border border-[#DDE8DF] bg-[#F5F8F5] text-[12px] font-medium text-[#566358] transition hover:border-[#B8DFC5] hover:bg-white hover:text-[#2D7A4F]"
        >
          もっと見る
          <ChevronDown className="h-3.5 w-3.5" aria-hidden />
        </button>
      ) : null}

      {totalPages > 1 ? (
        <nav
          className="flex items-center justify-center gap-0.5"
          aria-label="ページネーション"
        >
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#566358] transition enabled:hover:bg-[#EAF4ED] disabled:opacity-40"
            aria-label="前のページ"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`ellipsis-${i}`} className="px-0.5 text-[11px] text-[#AABCAA]">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p as number)}
                className={`flex h-7 min-w-[28px] items-center justify-center rounded-full px-1.5 text-[12px] font-medium transition ${
                  currentPage === p
                    ? "bg-[#2D7A4F] text-white"
                    : "text-[#566358] hover:bg-[#EAF4ED]"
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
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#566358] transition enabled:hover:bg-[#EAF4ED] disabled:opacity-40"
            aria-label="次のページ"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </nav>
      ) : null}
    </div>
  );
}

function useMemoPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "…", total];
  }
  if (current >= total - 3) {
    return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, "…", current - 1, current, current + 1, "…", total];
}
