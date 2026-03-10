"use client";

import Link from "next/link";

export function WelcomeFooterLinks() {
  return (
    <p
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-sm text-slate-500"
      role="navigation"
      aria-label="補助導線"
    >
      <Link
        href="/events"
        className="underline decoration-slate-300 underline-offset-2 transition hover:text-slate-700 hover:decoration-slate-500"
      >
        まずはイベントを見てみる
      </Link>
      <span className="text-slate-300" aria-hidden>
        /
      </span>
      <Link
        href="/"
        className="underline decoration-slate-300 underline-offset-2 transition hover:text-slate-700 hover:decoration-slate-500"
      >
        あとで決める
      </Link>
    </p>
  );
}
