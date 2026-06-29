"use client";

import { useState } from "react";
import { FileText, ChevronRight } from "lucide-react";

type Props = {
  description?: string | null;
};

export function MobileEventOverviewTab({ description }: Props) {
  const [expanded, setExpanded] = useState(false);
  const text = description?.trim() ?? "";

  if (!text) {
    return (
      <div className="ed-content-card p-4">
        <div className="ed-content-card-header">
          <span className="ed-content-card-icon">
            <FileText className="h-4 w-4" aria-hidden />
          </span>
          <h2 className="text-[15px] font-semibold text-[var(--ed-ink)]">概要</h2>
        </div>
        <p className="mt-3 text-[13px] text-[var(--ed-muted)]">概要はまだありません。</p>
      </div>
    );
  }

  const isLong = text.length > 100;

  return (
    <div className="ed-content-card p-4">
      <div className="ed-content-card-header">
        <span className="ed-content-card-icon">
          <FileText className="h-4 w-4" aria-hidden />
        </span>
        <h2 className="text-[15px] font-semibold text-[var(--ed-ink)]">概要</h2>
      </div>
      <p
        className={
          expanded
            ? "mt-3 whitespace-pre-wrap text-[13.5px] leading-[1.75] text-[var(--ed-muted)]"
            : "mt-3 line-clamp-4 whitespace-pre-wrap text-[13.5px] leading-[1.75] text-[var(--ed-muted)]"
        }
      >
        {text}
      </p>
      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 inline-flex items-center gap-0.5 text-[13px] font-semibold text-[var(--ed-forest,var(--ed-accent))]"
        >
          {expanded ? "閉じる" : "もっと見る"}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
