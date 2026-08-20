"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/** root layout 自体が落ちたとき用の境界。app/error.tsx が拾えない範囲をここで受ける。 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ja">
      <body className="flex min-h-screen flex-col items-center justify-center px-4">
        <h1 className="text-lg font-semibold text-zinc-900">
          エラーが発生しました
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          時間をおいて再度お試しください
        </p>
      </body>
    </html>
  );
}
