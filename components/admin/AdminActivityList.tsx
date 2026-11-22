import Link from "next/link";

export type AdminActivityItem = {
  id: string;
  createdAt: string;
  actionLabel: string;
  actorName: string | null;
  targetName: string | null;
};

export function AdminActivityList({
  items,
  emptyMessage = "最近の操作はありません",
}: {
  items: AdminActivityItem[];
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return (
      <p className="px-1 py-6 text-center text-sm text-[#7a9888]">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-[#eef4f0]">
      {items.map((item) => (
        <li key={item.id} className="flex gap-2 py-1.5 first:pt-0 last:pb-0">
          <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#173f2c]" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[#0e1610]">{item.actionLabel}</p>
            <p className="mt-0.5 text-[10px] text-[#7a9888]">
              {item.actorName ?? "管理者"}
              {item.targetName ? ` · ${item.targetName}` : ""}
              {" · "}
              {new Date(item.createdAt).toLocaleString("ja-JP")}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AdminTodoCard({
  href,
  label,
  count,
  tone = "warning",
}: {
  href: string;
  label: string;
  count: number;
  tone?: "warning" | "danger" | "info" | "success";
}) {
  const tones = {
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    danger: "border-red-200 bg-red-50 text-red-900",
    info: "border-sky-200 bg-sky-50 text-sky-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  } as const;

  // 0件のときは目立たせない（対応が要るものだけ色をつける）
  const zero = count === 0;
  return (
    <Link
      href={href}
      className={`flex min-w-[11rem] flex-1 items-center justify-between gap-3 rounded-xl border px-4 py-3 transition hover:opacity-90 ${
        zero ? "border-[#e6e2d6] bg-white text-[#6b776f]" : `${tones[tone]} shadow-sm`
      }`}
    >
      <span className="text-[13px] font-semibold">{label}</span>
      <span className={`text-2xl font-bold tabular-nums ${zero ? "text-[#b8beb9]" : ""}`}>
        {count.toLocaleString("ja-JP")}
      </span>
    </Link>
  );
}
