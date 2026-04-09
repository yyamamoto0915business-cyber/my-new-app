"use client";

type ApplicationSummaryCardsProps = {
  total: number;
  pendingCount: number;
  acceptedCount: number;
  rejectedCount: number;
  capacity: number | null;
  activeStatus?: "all" | "pending" | "accepted" | "rejected";
  onStatusSelect?: (status: "all" | "pending" | "accepted" | "rejected") => void;
};

export function ApplicationSummaryCards({
  total,
  pendingCount,
  acceptedCount,
  rejectedCount,
  capacity,
  activeStatus = "all",
  onStatusSelect,
}: ApplicationSummaryCardsProps) {
  const remaining =
    capacity != null && capacity > 0 ? Math.max(0, capacity - acceptedCount) : null;

  const cards = [
    { value: total, label: "総応募数", key: "total", status: "all" as const },
    { value: acceptedCount, label: "承認済み", key: "accepted", status: "accepted" as const },
    { value: pendingCount, label: "未確認", key: "pending", status: "pending" as const },
    { value: rejectedCount, label: "却下", key: "rejected", status: "rejected" as const },
    ...(remaining != null ? [{ value: remaining, label: "定員まで残数", key: "remaining" as const }] : []),
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
      {cards.map(({ key, value, label, status }) => {
        const selectable = Boolean(status && onStatusSelect);
        const isActive = status ? activeStatus === status : false;
        const className = selectable
          ? `rounded-2xl border px-4 py-3 shadow-sm transition sm:px-5 sm:py-4 ${
              isActive
                ? "border-[var(--mg-accent,theme(colors.amber.600))] bg-amber-50/60 ring-2 ring-amber-200/70"
                : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md"
            }`
          : "rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm sm:px-5 sm:py-4";
        return selectable ? (
          <button
            key={key}
            type="button"
            onClick={() => onStatusSelect?.(status!)}
            className={className}
            aria-pressed={isActive}
            aria-label={`${label}で絞り込み`}
          >
            <p className="text-xl font-bold text-slate-900 sm:text-2xl">{value}</p>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">{label}</p>
          </button>
        ) : (
          <div
          key={key}
            className={className}
          >
            <p className="text-xl font-bold text-slate-900 sm:text-2xl">{value}</p>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">{label}</p>
          </div>
        );
      })}
    </div>
  );
}
