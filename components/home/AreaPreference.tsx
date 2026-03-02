"use client";

import { PREFECTURES } from "@/lib/prefectures";
import { getAreaPreference, setAreaPreference } from "@/lib/area-preference-storage";

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

const AREA_OPTIONS = [
  { id: "", name: "すべての地域" },
  ...PREFECTURES.map((p) => ({ id: p, name: p })),
];

export function AreaPreference({ value, onChange, className = "" }: Props) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-[var(--foreground-muted)]">マイエリア：</span>
      <select
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          setAreaPreference(v);
          onChange(v);
        }}
        className="min-h-[44px] rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm dark:bg-[var(--background)] dark:border-zinc-600 sm:min-h-0 sm:py-1.5"
      >
        {AREA_OPTIONS.map((p) => (
          <option key={p.id || "all"} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
