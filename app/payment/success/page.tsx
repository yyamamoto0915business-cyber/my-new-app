import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-[var(--mg-paper)]">
      <main className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-2xl border border-[var(--mg-line)] bg-white p-8 shadow-[var(--mg-shadow)] dark:bg-zinc-900/50">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-emerald-600 dark:text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="mt-6 text-center text-xl font-bold text-[var(--mg-ink)]">
            お支払いが完了しました
          </h1>
          <p className="mt-2 text-center text-sm text-[var(--mg-muted)]">
            ご利用ありがとうございます。引き続き MachiGlyph をお楽しみください。
          </p>
          <div className="mt-8 space-y-4">
            <Link
              href="/"
              className="flex min-h-[var(--mg-touch-min)] w-full items-center justify-center rounded-xl bg-[var(--mg-accent)] py-3 font-medium text-white transition-opacity hover:opacity-90"
            >
              トップへ戻る
            </Link>
            <Link
              href="/profile"
              className="flex min-h-[var(--mg-touch-min)] w-full items-center justify-center rounded-xl border border-[var(--mg-line)] py-3 font-medium text-[var(--mg-ink)] transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              マイページへ
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
