import type { ReactNode } from "react";

export type AdminBadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

const TONE: Record<AdminBadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  success: "bg-[#E6F4EA] text-[#1E7E34] ring-emerald-100",
  warning: "bg-[#FEF3C7] text-[#B45309] ring-amber-100",
  danger: "bg-[#FDE8E8] text-[#C81E1E] ring-red-100",
  info: "bg-sky-50 text-sky-800 ring-sky-100",
};

export function AdminStatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: AdminBadgeTone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ${TONE[tone]}`}
    >
      {children}
    </span>
  );
}
