import type { ReactNode } from "react";

type AdminStatCardProps = {
  label: string;
  value: string | number;
  helper?: string;
  icon?: ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "info";
  href?: string;
};

const TONE_BORDER = {
  default: "border-[#d8e8dc] bg-white",
  success: "border-emerald-200 bg-emerald-50/60",
  warning: "border-amber-200 bg-amber-50/60",
  danger: "border-red-200 bg-red-50/60",
  info: "border-sky-200 bg-sky-50/60",
} as const;

export function AdminStatCard({
  label,
  value,
  helper,
  icon,
  tone = "default",
}: AdminStatCardProps) {
  const display =
    typeof value === "number" ? value.toLocaleString("ja-JP") : value;

  return (
    <div
      className={`flex flex-col gap-0.5 rounded-lg border px-3 py-2.5 shadow-sm ${TONE_BORDER[tone]}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-medium text-[#7a9888]">{label}</div>
        {icon ? (
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#eaf2ec] text-[#1e3848]">
            {icon}
          </div>
        ) : null}
      </div>
      <div className="text-xl font-semibold tracking-tight text-[#0e1610]">
        {display}
      </div>
      {helper ? (
        <div className="text-[10px] leading-tight text-[#7a9888]">{helper}</div>
      ) : null}
    </div>
  );
}
