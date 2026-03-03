import Link from "next/link";

type Props = { params: Promise<{ id: string }> };

export default async function SponsorApplyThanksPage({ params }: Props) {
  const { id: eventId } = await params;

  return (
    <div className="min-h-screen bg-[var(--mg-paper)]">
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm dark:bg-zinc-900/95 [border-color:var(--mg-line)]">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <Link
            href={`/events/${eventId}`}
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ← イベント詳細へ
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            申込を受け付けました
          </h1>
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            運営から連絡します。
          </p>
          <Link
            href={`/events/${eventId}`}
            className="mt-6 inline-block rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            イベント詳細へ戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
