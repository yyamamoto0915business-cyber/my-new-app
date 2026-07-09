"use client";

import {
  Heart,
  Clock,
  GraduationCap,
  Users,
  Smile,
  Sprout,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConditionKey } from "@/components/volunteer/pc/PcVolunteerConditionTags";

const TAGS: { key: ConditionKey; label: string; Icon: LucideIcon }[] = [
  { key: "beginner", label: "初めてOK", Icon: Heart },
  { key: "shortTime", label: "短時間OK", Icon: Clock },
  { key: "student", label: "学生歓迎", Icon: GraduationCap },
  { key: "family", label: "親子で参加OK", Icon: Users },
  { key: "senior", label: "シニア歓迎", Icon: Smile },
];

type Props = {
  active: Set<ConditionKey>;
  onToggle: (key: ConditionKey) => void;
};

export function MobileVolunteerPopularTags({ active, onToggle }: Props) {
  return (
    <section aria-label="人気の条件から探す" className="mg-mobile-section">
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Sprout className="h-3.5 w-3.5 text-[#2f7d4e]" aria-hidden />
          <h2 className="mg-mobile-section-title">人気の条件から探す</h2>
        </div>
        <button type="button" className="shrink-0 text-[11px] font-medium text-[#2f6b4f]">
          すべて見る →
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
        {TAGS.map(({ key, label, Icon }) => {
          const isActive = active.has(key);
          return (
            <button
              key={key}
              type="button"
              aria-pressed={isActive}
              onClick={() => onToggle(key)}
              className={cn(
                "mg-mobile-chip",
                isActive ? "mg-mobile-chip-active" : "mg-mobile-chip-inactive"
              )}
            >
              <Icon className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
              {label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
