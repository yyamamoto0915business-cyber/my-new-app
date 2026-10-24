"use client";

/** 日本時間の今日（from があればその日）から days 日あとの日付（YYYY-MM-DD）。 */
export function jstDate(days = 0, from?: string): string {
  const base = from ? new Date(`${from}T00:00:00+09:00`) : new Date();
  const value = new Date(base.getTime() + days * 86400000);
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(value);
}

/** 開催期間のまちがい（なければ null）。 */
export function periodProblem(startDate: string, endDate: string): string | null {
  if (!startDate || !endDate) return "開催期間の開始日と終了日を入れてください";
  if (endDate < startDate) return "終了日は開始日より後にしてください";
  return null;
}

const PRESETS = [
  { label: "1日", days: 0 },
  { label: "1週間", days: 6 },
  { label: "1か月", days: 29 },
  { label: "3か月", days: 89 },
];

/** 開催期間の下に出す、よく使う長さのボタンと、日数（またはまちがい）の表示。 */
export function PeriodPresets({
  startDate,
  endDate,
  onStart,
  onEnd,
}: {
  startDate: string;
  endDate: string;
  onStart: (date: string) => void;
  onEnd: (date: string) => void;
}) {
  const problem = periodProblem(startDate, endDate);
  const days = problem
    ? 0
    : Math.round((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86400000) + 1;
  const chip = (on: boolean) => ({
    minHeight: "2rem",
    padding: "0 0.75rem",
    border: `1.5px solid ${on ? "#1f7a4a" : "#dfe7e1"}`,
    borderRadius: 999,
    background: on ? "#eef7f1" : "#fff",
    color: on ? "#1f7a4a" : "#3c4a40",
    fontSize: "0.75rem",
    fontWeight: 800,
    cursor: "pointer",
  });
  return (
    <div style={{ display: "grid", gap: "0.35rem", marginTop: "0.45rem" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            style={chip(Boolean(startDate) && endDate === jstDate(preset.days, startDate))}
            onClick={() => onEnd(jstDate(preset.days, startDate || jstDate()))}
          >
            {preset.label}
          </button>
        ))}
        <button
          type="button"
          style={{ ...chip(false), border: 0, background: "none", color: "#1f7a4a", textDecoration: "underline" }}
          onClick={() => {
            onStart(jstDate());
            if (!endDate || endDate < jstDate()) onEnd(jstDate(29));
          }}
        >
          今日から
        </button>
      </div>
      <small style={{ fontSize: "0.72rem", color: problem ? "#c0392b" : "#6a7568" }}>
        {problem ?? `${days}日間。この期間だけ参加できます。`}
      </small>
    </div>
  );
}
