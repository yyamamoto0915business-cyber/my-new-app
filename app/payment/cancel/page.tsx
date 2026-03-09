"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("return") ?? "/";

  return (
    <div className="min-h-screen bg-[var(--mg-paper)]">
      <main className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-2xl border border-[var(--mg-line)] bg-white p-8 shadow-[var(--mg-shadow)] dark:bg-zinc-900/50">
          <h1 className="text-center text-xl font-bold text-[var(--mg-ink)]">
            お支払いがキャンセルされました
          </h1>
          <p className="mt-2 text-center text-sm text-[var(--mg-muted)]">
            決済は行われていません。お手続きを中断された場合は、お気軽に再度お申し込みください。
          </p>
          <div className="mt-8 space-y-4">
            <Link
              href={returnTo}
              className="flex min-h-[var(--mg-touch-min)] w-full items-center justify-center rounded-xl bg-[var(--mg-accent)] py-3 font-medium text-white transition-opacity hover:opacity-90"
            >
              元のページに戻る
            </Link>
            <Link
              href="/"
              className="flex min-h-[var(--mg-touch-min)] w-full items-center justify-center rounded-xl border border-[var(--mg-line)] py-3 font-medium text-[var(--mg-ink)] transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              トップへ
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--mg-paper)] flex items-center justify-center">
        <p className="text-[var(--mg-muted)]">読み込み中...</p>
      </div>
    }>
      <PaymentCancelContent />
    </Suspense>
  );
}
