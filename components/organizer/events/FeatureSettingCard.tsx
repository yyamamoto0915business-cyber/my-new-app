import Link from "next/link";
import { cn } from "@/lib/utils";

export type FeatureSettingAccent = "blue" | "green" | "orange";

export type FeatureSettingStatus =
  | "未設定"
  | "設定済み"
  | "無料"
  | "有料"
  | "確認中"
  | "要確認";

const ACCENT = {
  blue: {
    iconBg: "#EEF4FB",
    icon: "#2B6CB0",
    title: "#1e3a5f",
    btnBorder: "#5B8FC7",
    btnText: "#2B6CB0",
    statusBg: "#EEF4FB",
    statusText: "#2B6CB0",
  },
  green: {
    iconBg: "#EAF6DE",
    icon: "#2d7a32",
    title: "#1a5c22",
    btnBorder: "#348b38",
    btnText: "#2d7a32",
    statusBg: "#EAF6DE",
    statusText: "#2d7a32",
  },
  orange: {
    iconBg: "#FFF4E8",
    icon: "#C26A1A",
    title: "#9A4E0E",
    btnBorder: "#D4893A",
    btnText: "#C26A1A",
    statusBg: "#FFF4E8",
    statusText: "#C26A1A",
  },
} as const;

type Props = {
  title: string;
  description: string;
  buttonLabel: string;
  icon: React.ReactNode;
  status?: FeatureSettingStatus | null;
  /** 設定済み時の要約行 */
  summaryLines?: string[];
  accent: FeatureSettingAccent;
  href?: string;
  onClick?: () => void;
  /** 中央の主要カードとして少し強調 */
  emphasized?: boolean;
};

export function FeatureSettingCard({
  title,
  description,
  buttonLabel,
  icon,
  status,
  summaryLines,
  accent,
  href,
  onClick,
  emphasized = false,
}: Props) {
  const c = ACCENT[accent];

  const actionClass = cn(
    "inline-flex items-center justify-center rounded-[8px] border bg-white px-3 py-1.5 text-[11px] font-semibold transition hover:bg-[#fafaf8]"
  );

  const actionStyle = {
    borderColor: c.btnBorder,
    color: c.btnText,
  } as const;

  const action = href ? (
    <Link href={href} className={actionClass} style={actionStyle}>
      {buttonLabel}
      <span className="ml-1" aria-hidden>
        →
      </span>
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={actionClass} style={actionStyle}>
      {buttonLabel}
      <span className="ml-1" aria-hidden>
        →
      </span>
    </button>
  );

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col rounded-[12px] border bg-white px-3.5 py-3",
        emphasized
          ? "border-[#cfe5c8] shadow-[0_1px_4px_rgba(52,139,56,0.08)]"
          : "border-[#e8e6e0]"
      )}
    >
      <div className="flex items-start gap-2.5">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]"
          style={{ background: c.iconBg, color: c.icon }}
          aria-hidden
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3
            className="text-[13px] font-semibold leading-snug"
            style={{ color: c.title }}
          >
            {title}
          </h3>
          {summaryLines && summaryLines.length > 0 ? (
            <ul className="mt-1.5 space-y-0.5">
              {summaryLines.map((line) => (
                <li key={line} className="text-[11px] leading-snug text-[#555]">
                  {line}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-[11px] leading-[1.55] text-[#888]">{description}</p>
          )}
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {status ? (
          <span
            className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none"
            style={{ background: c.statusBg, color: c.statusText }}
          >
            {status}
          </span>
        ) : null}
        {action}
      </div>
    </div>
  );
}
