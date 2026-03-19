"use client";

type Props = {
  onLocateCurrentPosition?: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
};

export function MapFloatingControls({
  onLocateCurrentPosition,
  onZoomIn,
  onZoomOut,
}: Props) {
  const hasLocate = Boolean(onLocateCurrentPosition);
  return (
    <div className="pointer-events-none absolute bottom-3 right-3 z-[1000] flex flex-col gap-2">
      <div className="pointer-events-auto flex flex-col rounded-2xl border border-zinc-200/70 bg-white/95 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90">
        <button
          type="button"
          onClick={onZoomIn}
          className="min-h-[44px] min-w-[44px] rounded-t-2xl px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800"
          aria-label="ズームイン"
        >
          ＋
        </button>
        <div className="h-px w-full bg-zinc-200/60 dark:bg-zinc-700" />
        <button
          type="button"
          onClick={onZoomOut}
          className={`min-h-[44px] min-w-[44px] px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800 ${
            !hasLocate ? "rounded-b-2xl" : ""
          }`}
          aria-label="ズームアウト"
        >
          －
        </button>
        {onLocateCurrentPosition && (
          <>
            <div className="h-px w-full bg-zinc-200/60 dark:bg-zinc-700" />
            <button
              type="button"
              onClick={onLocateCurrentPosition}
              className="min-h-[44px] min-w-[44px] rounded-b-2xl px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800"
              aria-label="現在地に移動"
              title="現在地に移動"
            >
              ⦿
            </button>
          </>
        )}
      </div>
    </div>
  );
}

