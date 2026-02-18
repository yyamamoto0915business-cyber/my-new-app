"use client";

import Link from "next/link";

type Item = { label: string; href?: string };

type Props = {
  items: Item[];
  className?: string;
};

export function Breadcrumb({ items, className = "" }: Props) {
  return (
    <nav aria-label="パンくず" className={`flex flex-wrap items-center gap-1.5 text-sm ${className}`}>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-zinc-400">›</span>}
          {item.href ? (
            <Link
              href={item.href}
              className="text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
