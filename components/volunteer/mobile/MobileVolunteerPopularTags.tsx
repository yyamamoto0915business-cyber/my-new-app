"use client";

import type { ConditionKey } from "@/components/volunteer/pc/PcVolunteerConditionTags";

const TAGS: { key: ConditionKey; label: string }[] = [
  { key: "beginner", label: "初めてOK" },
  { key: "shortTime", label: "短時間OK" },
  { key: "student", label: "学生歓迎" },
  { key: "family", label: "親子で参加OK" },
  { key: "senior", label: "シニア歓迎" },
];

type Props = {
  active: Set<ConditionKey>;
  onToggle: (key: ConditionKey) => void;
};

export function MobileVolunteerPopularTags({ active, onToggle }: Props) {
  return (
    <section aria-label="人気の条件から探す" className="px-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[13px] font-semibold text-[#1A2214]">人気の条件から探す</h2>
        <button type="button" className="shrink-0 text-[11px] font-medium text-[#2D7A4F]">
          すべて見る &gt;
        </button>
      </div>
      <div className="mt-1.5 flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
        {TAGS.map(({ key, label }) => {
          const isActive = active.has(key);
          return (
            <button
              key={key}
              type="button"
              aria-pressed={isActive}
              onClick={() => onToggle(key)}
              className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-[11px] transition ${
                isActive
                  ? "border-[#2D7A4F] bg-[#EAF4ED] text-[#2D7A4F]"
                  : "border-[#DDE8DF] bg-white text-[#566358]"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
