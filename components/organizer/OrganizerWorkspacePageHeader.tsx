"use client";

import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
};

/** 上部タブ配下のページ見出し */
export function OrganizerWorkspacePageHeader({
  title,
  subtitle,
  actions,
  className = "",
}: Props) {
  return (
    <header
      className={`flex flex-col gap-3 min-[900px]:flex-row min-[900px]:items-start min-[900px]:justify-between ${className}`}
    >
      <div className="min-w-0">
        <h1 className="font-[family-name:var(--font-shippori-mincho),var(--font-serif-display),serif] text-[22px] font-medium tracking-[0.04em] text-[#1a2214] min-[900px]:text-[24px]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-[#566358]">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
