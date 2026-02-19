"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        エラーが発生しました
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {error.message || "問題が発生しました"}
      </p>
      <div className="mt-6 flex gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          再試行
        </button>
        <Link
          href="/?mode=select"
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium dark:border-zinc-700"
        >
          トップへ
        </Link>
      </div>
    </div>
  );
}
