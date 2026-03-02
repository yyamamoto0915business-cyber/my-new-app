"use client";

import Link from "next/link";
import type { ProfileMode } from "./mode-switcher";
import { MODE_CONFIG } from "./mode-config";
import { ProfileEmptyCard } from "./profile-empty-card";

type ListItem = {
  id: string;
  title: string;
  href: string;
  subText?: string;
};

type Props = {
  mode: ProfileMode;
  list1: ListItem[];
  list2: ListItem[];
};

/** 2カラムの一覧セクション（モード別タイトル・空状態対応） */
export function ModeLists({ mode, list1, list2 }: Props) {
  const config = MODE_CONFIG[mode];

  return (
    <section className="grid gap-6 md:grid-cols-2">
      <div>
        <h3 className="mb-3 text-sm font-medium text-[var(--foreground-muted)]">
          {config.list1.title}
        </h3>
        {list1.length === 0 ? (
          <ProfileEmptyCard
            title={config.empty1.title}
            description={`→ ${config.empty1.ctaLabel}`}
            ctaLabel={config.empty1.ctaLabel}
            ctaHref={config.empty1.ctaHref}
          />
        ) : (
          <ul className="space-y-2">
            {list1.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="block rounded-xl border border-[var(--border)] bg-white p-3 transition-shadow hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900/50"
                >
                  <p className="font-medium">{item.title}</p>
                  {item.subText && (
                    <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">{item.subText}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-[var(--foreground-muted)]">
          {config.list2.title}
        </h3>
        {list2.length === 0 ? (
          <ProfileEmptyCard
            title={config.empty2.title}
            description={`→ ${config.empty2.ctaLabel}`}
            ctaLabel={config.empty2.ctaLabel}
            ctaHref={config.empty2.ctaHref}
          />
        ) : (
          <ul className="space-y-2">
            {list2.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="block rounded-xl border border-[var(--border)] bg-white p-3 transition-shadow hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900/50"
                >
                  <p className="font-medium">{item.title}</p>
                  {item.subText && (
                    <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">{item.subText}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
