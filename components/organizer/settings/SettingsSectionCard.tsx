"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type SettingsSectionCardProps = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export function SettingsSectionCard({
  title,
  description,
  href,
  icon: Icon,
  badge,
}: SettingsSectionCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-slate-300/80 hover:shadow-md sm:p-5"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-slate-200/80 group-hover:text-slate-800"
        aria-hidden
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-slate-900">{title}</h2>
          {badge && (
            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <span
        className="shrink-0 text-slate-400 transition group-hover:text-slate-600"
        aria-hidden
      >
        →
      </span>
    </Link>
  );
}
