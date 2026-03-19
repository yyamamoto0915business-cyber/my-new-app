"use client";

type Props = {
  count: number;
  searchQuery: string;
  onSearchQueryChange: (v: string) => void;
  onClear?: () => void;
  showHint?: boolean;
  hintText?: string;
};

export function MapSearchHeader({
  count,
  searchQuery,
  onSearchQueryChange,
  onClear,
  showHint = false,
  hintText = "地図をドラッグして、このエリアのイベントを探せます。",
}: Props) {
  const countLabel = count > 0 ? `このエリアのイベント ${count}件` : "このエリアで探せます";
  return (
    <div className="rounded-2xl border border-zinc-200/70 bg-white/92 px-2.5 py-2 shadow-sm backdrop-blur dark:border-zinc-700/70 dark:bg-zinc-900/70">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 shadow-sm focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent-soft)] dark:border-zinc-700 dark:bg-zinc-800">
          <svg
            aria-hidden
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-zinc-400"
          >
            <path
              d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M16.2 16.2 21 21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <label className="sr-only" htmlFor="event-map-search">
            イベント検索
          </label>
          <input
            id="event-map-search"
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="イベント名・地域・キーワードで探す"
            className="h-[44px] w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
          />
        </div>
        {searchQuery && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="min-h-[44px] min-w-[44px] rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-600 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            aria-label="検索をクリア"
          >
            ✕
          </button>
        )}
      </div>

      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{countLabel}</p>
      </div>

      {showHint && <p className="mt-1 text-[12px] text-zinc-500">{hintText}</p>}
    </div>
  );
}

