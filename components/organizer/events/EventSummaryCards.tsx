"use client";

type SummaryCardsProps = {
  total: number;
  publicCount: number;
  draftCount: number;
  endedCount: number;
  onStatusClick?: (status: "all" | "public" | "draft" | "ended") => void;
  activeFilter: "all" | "public" | "draft" | "ended";
};

export function EventSummaryCards({
  total,
  publicCount,
  draftCount,
  endedCount,
  onStatusClick,
  activeFilter,
}: SummaryCardsProps) {
  const cards = [
    { key: "all" as const, value: total, label: "全イベント", filter: "all" as const },
    { key: "public", value: publicCount, label: "公開中", filter: "public" as const },
    { key: "draft", value: draftCount, label: "下書き", filter: "draft" as const },
    { key: "ended", value: endedCount, label: "終了済み", filter: "ended" as const },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map(({ key, value, label, filter }) => {
        const isActive = activeFilter === filter;
        const Comp = onStatusClick ? "button" : "div";
        const baseClass =
          "rounded-2xl border px-4 py-3 text-left transition sm:px-5 sm:py-4";
        const interactiveClass = onStatusClick
          ? "cursor-pointer hover:border-slate-300 hover:bg-slate-50/80 active:bg-slate-100"
          : "";
        const activeClass = isActive
          ? "border-slate-300 bg-slate-50 shadow-sm"
          : "border-slate-200/80 bg-white";

        return (
          <Comp
            key={key}
            type={Comp === "button" ? "button" : undefined}
            onClick={
              Comp === "button"
                ? () => onStatusClick?.(filter)
                : undefined
            }
            className={`${baseClass} ${interactiveClass} ${activeClass}`}
            aria-pressed={Comp === "button" && isActive ? true : undefined}
          >
            <p className="text-xl font-bold text-slate-900 sm:text-2xl">{value}</p>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">{label}</p>
          </Comp>
        );
      })}
    </div>
  );
}
