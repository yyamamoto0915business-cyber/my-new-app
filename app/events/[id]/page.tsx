import Link from "next/link";
import { getEventById } from "@/lib/events";
import { notFound } from "next/navigation";
import { EventChatButton } from "./event-chat-button";

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
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-zinc-200/60 bg-white/80 shadow-sm backdrop-blur-md dark:border-zinc-700/60 dark:bg-zinc-900/80">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Link
            href="/events"
            className="text-sm text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← イベント一覧へ
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <article className="rounded-2xl border border-zinc-200/60 bg-white/80 p-6 shadow-lg backdrop-blur-sm dark:border-zinc-700/60 dark:bg-zinc-900/80">
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
          <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
            <EventChatButton eventId={id} />
          </div>
        </article>
      </main>
    </div>
  );
}
