"use client";

import Link from "next/link";

type Props = {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  icon?: React.ReactNode;
};

export function ProfileEmptyCard({ title, description, ctaLabel, ctaHref, icon }: Props) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 text-center dark:border-zinc-700/60 dark:bg-zinc-900/95">
      {icon && (
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-[var(--foreground-muted)] dark:bg-zinc-800">
          {icon}
        </div>
      )}
      <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{title}</h3>
      <p className="mt-1 text-sm text-[var(--foreground-muted)]">{description}</p>
      <Link
        href={ctaHref}
        className="mt-4 inline-block rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 active:opacity-95"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
