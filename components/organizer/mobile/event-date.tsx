import { cn } from "@/lib/utils";

/**
 * 主催者のスマホ画面（ホーム・掲載管理）で、イベントの日付を同じ見た目で出すための部品。
 * 左の「日付のカレンダー」と、「あと◯日・開催中・今日・終了」の札。
 */

const WEEKDAY_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

/** 日本時間の今日（YYYY-MM-DD） */
export function todayJst(): string {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

/** 今日（YYYY-MM-DD）から ymd までの日数 */
export function daysBetween(today: string, ymd: string): number {
  const a = Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10));
  const b = Date.UTC(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10));
  return Math.round((b - a) / 86400000);
}

export type EventTiming = {
  /** 終わりの日が今日より前 */
  past: boolean;
  /** 何日も続くイベント（終わりの日が始まりの日より後） */
  multiDay: boolean;
  /** 終わりの日（M/D） */
  endLabel: string;
  /** 右の札（または2行目の色付きの字） */
  tag: { label: string; className: string; textClassName: string };
};

export function eventTiming(today: string, date: string, endDate?: string | null): EventTiming {
  const startDay = date.slice(0, 10);
  const lastDay = (endDate ?? date).slice(0, 10);
  const past = lastDay < today;
  const diff = daysBetween(today, startDay);
  const ongoing = !past && diff < 0;
  const [, em, ed] = lastDay.split("-").map(Number);
  const tag = past
    ? { label: "終了", className: "bg-[#eef0ec] text-[#8a958d]", textClassName: "text-[#9aa29c]" }
    : ongoing
      ? { label: "開催中", className: "bg-[#173f2c] text-[#f3e6bf]", textClassName: "text-[#173f2c]" }
      : diff === 0
        ? { label: "今日", className: "bg-[#c0572a] text-white", textClassName: "text-[#c0572a]" }
        : diff === 1
          ? { label: "明日", className: "bg-[#fbe7dc] text-[#b04c22]", textClassName: "text-[#b04c22]" }
          : diff <= 7
            ? { label: `あと${diff}日`, className: "bg-[#fbe7dc] text-[#b04c22]", textClassName: "text-[#b04c22]" }
            : { label: `あと${diff}日`, className: "bg-[#eef4ef] text-[#3f6250]", textClassName: "text-[#3f6250]" };
  return { past, multiDay: lastDay > startDay, endLabel: `${em}/${ed}`, tag };
}

/** 左に置く日付のカレンダー（月・日・曜日）。公開中は深い緑、下書きは淡い金、日付の過ぎたものは灰色 */
export function EventDateTile({
  date,
  status,
  past,
  className,
}: {
  date: string;
  status: "public" | "draft" | "ended" | "archived";
  past: boolean;
  className?: string;
}) {
  const day = date.slice(0, 10);
  const [, m, d] = day.split("-").map(Number);
  const wd = WEEKDAY_JA[new Date(`${day}T12:00:00+09:00`).getUTCDay()];
  const tone = past || status === "ended" || status === "archived" ? "past" : status === "public" ? "public" : "draft";
  return (
    <span
      className={cn(
        "flex h-[46px] w-[42px] shrink-0 flex-col items-center justify-center rounded-[12px] leading-none",
        tone === "past" && "bg-[#f1f2ef] text-[#a3aaa5]",
        tone === "public" && "bg-[#173f2c] text-white",
        tone === "draft" && "bg-[#fbf3e1] text-[#5f4810]",
        className
      )}
      aria-hidden
    >
      <span
        className={cn(
          "text-[9.5px] font-bold",
          tone === "public" && "text-[#e6d29b]",
          tone === "draft" && "text-[#a3812f]"
        )}
      >
        {m}月
      </span>
      <span className="mt-[3px] text-[17px] font-bold tracking-tight">{d}</span>
      <span className="mt-[3px] text-[9px] font-bold opacity-80">{wd}</span>
    </span>
  );
}
