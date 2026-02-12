import Link from "next/link";
import { getEventById } from "@/lib/events";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const event = getEventById(id);

  if (!event) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Link
            href="/events"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ← イベント一覧へ
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <article className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            {event.description}
          </p>

          <dl className="mt-6 space-y-4">
            <div>
              <dt className="text-sm font-medium text-zinc-500">日時</dt>
              <dd>
                {event.date} {event.startTime}
                {event.endTime && ` 〜 ${event.endTime}`}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-zinc-500">場所</dt>
              <dd>
                <span className="font-medium">{event.location}</span>
                <br />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {event.address}
                </span>
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-zinc-500">料金</dt>
              <dd>
                {event.price === 0 ? "無料" : `¥${event.price}`}
                {event.priceNote && (
                  <span className="ml-1 text-sm text-zinc-500">
                    （{event.priceNote}）
                  </span>
                )}
              </dd>
            </div>

            {event.rainPolicy && (
              <div>
                <dt className="text-sm font-medium text-zinc-500">雨天時</dt>
                <dd>{event.rainPolicy}</dd>
              </div>
            )}

            {event.itemsToBring && event.itemsToBring.length > 0 && (
              <div>
                <dt className="text-sm font-medium text-zinc-500">持ち物</dt>
                <dd>
                  <ul className="list-inside list-disc">
                    {event.itemsToBring.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}

            {event.access && (
              <div>
                <dt className="text-sm font-medium text-zinc-500">アクセス</dt>
                <dd>{event.access}</dd>
              </div>
            )}

            <div>
              <dt className="text-sm font-medium text-zinc-500">主催者</dt>
              <dd>
                {event.organizerName}
                {event.organizerContact && (
                  <span className="ml-1 text-sm">
                    （{event.organizerContact}）
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </article>
      </main>
    </div>
  );
}
