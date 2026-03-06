"use client";

import Link from "next/link";
import type { IconType } from "./profile-menu-link";
import type { ReactNode } from "react";

type QuickItem = {
  href: string;
  icon: IconType;
  title: string;
  subtitle: string;
  badge?: number;
};

const QUICK_ITEMS: QuickItem[] = [
  { href: "/messages", icon: "messages", title: "メッセージ", subtitle: "未読件数ややり取り状況" },
  { href: "/saved", icon: "saved", title: "保存したイベント", subtitle: "気になるイベント一覧へ" },
  { href: "/profile?mode=volunteer", icon: "volunteer", title: "応募中のボランティア", subtitle: "応募状況や参加予定へ" },
  { href: "/points", icon: "points", title: "マイポイント", subtitle: "保有ポイントと履歴確認" },
];

type Props = {
  unreadCount?: number;
};

/** よく使う項目：2列グリッドカード */
export function MypageQuickGrid({ unreadCount = 0 }: Props) {
  const items = QUICK_ITEMS.map((item) =>
    item.icon === "messages" && unreadCount > 0 ? { ...item, badge: unreadCount } : item
  );

  return (
    <section>
      <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        よく使う
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex flex-col gap-2 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98] dark:border-zinc-700/60 dark:bg-zinc-900/95 dark:hover:shadow-md sm:p-5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 transition-colors group-hover:bg-[var(--accent-soft)] group-hover:text-[var(--accent)] dark:bg-zinc-800 dark:text-zinc-400 dark:group-hover:bg-[var(--accent-soft)]/20 dark:group-hover:text-[var(--accent)]">
              <QuickGridIcon icon={item.icon} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{item.title}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                {item.subtitle}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function QuickGridIcon({ icon }: { icon: IconType }) {
  const className = "h-5 w-5";
  const icons: Record<IconType, ReactNode> = {
    messages: (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    saved: (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    ),
    volunteer: (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    points: (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    profile: <span />,
    notifications: <span />,
    organizer: <span />,
    event: <span />,
    recruitment: <span />,
  };
  return icons[icon] ?? null;
}
