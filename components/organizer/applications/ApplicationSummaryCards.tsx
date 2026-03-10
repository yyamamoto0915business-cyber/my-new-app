"use client";

type ApplicationSummaryCardsProps = {
  total: number;
  pendingCount: number;
  acceptedCount: number;
  rejectedCount: number;
  capacity: number | null;
};

export function ApplicationSummaryCards({
  total,
  pendingCount,
  acceptedCount,
  rejectedCount,
  capacity,
}: ApplicationSummaryCardsProps) {
  const remaining =
    capacity != null && capacity > 0 ? Math.max(0, capacity - acceptedCount) : null;

  const cards = [
    { value: total, label: "総応募数", key: "total" },
    { value: acceptedCount, label: "承認済み", key: "accepted" },
    { value: pendingCount, label: "未確認", key: "pending" },
    { value: rejectedCount, label: "却下", key: "rejected" },
    ...(remaining != null ? [{ value: remaining, label: "定員まで残数", key: "remaining" as const }] : []),
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
      {cards.map(({ key, value, label }) => (
        <div
          key={key}
          className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm sm:px-5 sm:py-4"
        >
          <p className="text-xl font-bold text-slate-900 sm:text-2xl">{value}</p>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">{label}</p>
        </div>
      ))}
    </div>
  );
}
