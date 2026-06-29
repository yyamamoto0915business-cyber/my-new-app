"use client";

type ConditionKey = "beginner" | "shortTime" | "student" | "family" | "senior";

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

export function PcVolunteerConditionTags({ active, onToggle }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="人気の条件">
      {TAGS.map(({ key, label }) => {
        const isActive = active.has(key);
        return (
          <button
            key={key}
            type="button"
            aria-pressed={isActive}
            onClick={() => onToggle(key)}
            className={`inline-flex cursor-pointer items-center rounded-full border px-3.5 py-[6px] text-[12px] font-medium transition ${
              isActive
                ? "border-[#2D7A4F] bg-[#EAF4ED] text-[#2D7A4F]"
                : "border-[#DDE8DF] bg-white text-[#566358] hover:border-[#2D7A4F] hover:text-[#2D7A4F]"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export type { ConditionKey };
