"use client";

import { CalendarDays, CheckCircle2, FilePenLine, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

type SummaryCardsProps = {
  total: number;
  publicCount: number;
  draftCount: number;
  endedCount: number;
  onStatusClick?: (status: "all" | "public" | "draft" | "ended") => void;
  activeFilter: "all" | "public" | "draft" | "ended" | null;
};

const CARD_CONFIG = [
  {
    key: "all" as const,
    label: "全イベント",
    filter: "all" as const,
    tone: "green" as const,
    icon: CalendarDays,
  },
  {
    key: "public" as const,
    label: "公開中",
    filter: "public" as const,
    tone: "blue" as const,
    icon: Globe,
  },
  {
    key: "draft" as const,
    label: "下書き",
    filter: "draft" as const,
    tone: "amber" as const,
    icon: FilePenLine,
  },
  {
    key: "ended" as const,
    label: "終了済み",
    filter: "ended" as const,
    tone: "rose" as const,
    icon: CheckCircle2,
  },
] as const;

const TONE_CLASS = {
  green: {
    icon: "bg-[#EAF4ED] text-[#2D7A4F]",
    active: "border-[#2D7A4F] ring-2 ring-[#2D7A4F]/12",
  },
  blue: {
    icon: "bg-[#E3F2FD] text-[#1976D2]",
    active: "border-[#1976D2] ring-2 ring-[#1976D2]/12",
  },
  amber: {
    icon: "bg-[#FFF8E8] text-[#CF9010]",
    active: "border-[#CF9010] ring-2 ring-[#CF9010]/12",
  },
  rose: {
    icon: "bg-[#FFEBEE] text-[#E53935]",
    active: "border-[#E53935] ring-2 ring-[#E53935]/12",
  },
} as const;

export function EventSummaryCards({
  total,
  publicCount,
  draftCount,
  endedCount,
  onStatusClick,
  activeFilter,
}: SummaryCardsProps) {
  const values = { all: total, public: publicCount, draft: draftCount, ended: endedCount };

  return (
    <section aria-label="イベントの概要">
      <div className="grid grid-cols-2 gap-2 min-[900px]:grid-cols-4 min-[900px]:gap-3">
        {CARD_CONFIG.map(({ key, label, filter, tone, icon: Icon }) => {
          const isActive = activeFilter !== null && activeFilter === filter;
          const value = values[key];
          const t = TONE_CLASS[tone];

          return (
            <button
              key={key}
              type="button"
              onClick={() => onStatusClick?.(filter)}
              aria-label={`${label}で絞り込む`}
              aria-pressed={isActive}
              className={cn(
                "org-events-stat-card text-left transition",
                isActive && t.active
              )}
            >
              <span className={cn("org-events-stat-card__icon", t.icon)} aria-hidden>
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="org-events-stat-card__value">{value}</p>
                <p className="org-events-stat-card__label">{label}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
