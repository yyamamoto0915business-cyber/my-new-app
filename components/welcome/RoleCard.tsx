"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Props = {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  href: string;
  /** ほんの少し目立たせる（イベントカード用） */
  primary?: boolean;
};

export function RoleCard({
  icon,
  title,
  description,
  buttonLabel,
  href,
  primary = false,
}: Props) {
  return (
    <Link
      href={href}
      className="group flex min-h-[160px] flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md active:scale-[0.98] sm:p-6"
    >
      <div
        className={`mb-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          primary ? "bg-[var(--mg-accent-soft)] text-[var(--mg-accent)]" : "bg-slate-100 text-slate-600"
        }`}
      >
        {icon}
      </div>
      <h2 className="font-semibold text-slate-900 group-hover:text-slate-800">
        {title}
      </h2>
      <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-600">
        {description}
      </p>
      <span
        className={`mt-4 inline-flex items-center gap-1 text-sm font-medium ${
          primary ? "text-[var(--mg-accent)]" : "text-slate-600"
        } group-hover:gap-2`}
      >
        {buttonLabel}
        <ChevronRight className="h-4 w-4 shrink-0" />
      </span>
    </Link>
  );
}
