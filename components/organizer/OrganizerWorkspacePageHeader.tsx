"use client";

import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  /** モバイルで見出しとアクションを1行にし、説明文を省略 */
  compact?: boolean;
};

/** 上部タブ配下のページ見出し */
export function OrganizerWorkspacePageHeader({
  title,
  subtitle,
  actions,
  className = "",
  compact = false,
}: Props) {
  return (
    <header
      className={`flex flex-col gap-3 min-[900px]:flex-row min-[900px]:items-start min-[900px]:justify-between ${
        compact ? "max-[899px]:flex-row max-[899px]:items-center max-[899px]:justify-between max-[899px]:gap-2" : ""
      } ${className}`}
    >
      <div className="min-w-0">
        <h1
          className={`font-[family-name:var(--font-shippori-mincho),var(--font-serif-display),serif] font-medium tracking-[0.03em] text-[#1a2214] min-[900px]:text-[24px] ${
            compact ? "text-[15px] leading-snug" : "text-[22px]"
          }`}
        >
          {title}
        </h1>
        {subtitle ? (
          <p
            className={`max-w-2xl text-[13px] leading-relaxed text-[#566358] min-[900px]:mt-1.5 ${
              compact ? "max-[899px]:hidden" : "mt-1.5"
            }`}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div
          className={`flex shrink-0 flex-wrap items-center gap-2 ${
            compact ? "max-[899px]:[&_a]:whitespace-nowrap" : ""
          }`}
        >
          {actions}
        </div>
      ) : null}
    </header>
  );
}
