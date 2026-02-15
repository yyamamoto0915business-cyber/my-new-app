import Link from "next/link";
import { getEvents } from "@/lib/events";

// Mock: ログイン中の主催者（本来は認証から取得）
const MOCK_ORGANIZER = "地域振興会";

export default function OrganizerEventsPage() {
  const allEvents = getEvents();
  const myEvents = allEvents.filter((e) => e.organizerName === MOCK_ORGANIZER);

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Link
            href="/events"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ← イベント一覧へ
          </Link>
          <div className="mt-2 flex items-center justify-between">
            <h1 className="text-2xl font-bold">主催イベント一覧</h1>
            <Link
              href="/organizer/events/new"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              新規作成
            </Link>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            主催者: {MOCK_ORGANIZER} として表示中
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <ul className="space-y-4">
          {myEvents.length === 0 ? (
            <li className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-zinc-500">
                登録イベントがありません。新規作成してください。
              </p>
              <Link
                href="/organizer/events/new"
                className="mt-4 inline-block text-blue-600 underline hover:text-blue-700"
              >
                新規イベントを作成する
              </Link>
            </li>
          ) : (
            myEvents.map((event) => (
              <li key={event.id}>
                <div className="flex items-start gap-2 rounded-lg border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                  <Link
                    href={`/events/${event.id}`}
                    className="flex-1"
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <h2 className="font-semibold">{event.title}</h2>
                        <p className="mt-1 text-sm text-zinc-500">
                          {event.date} {event.startTime}〜 {event.location}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 self-start rounded px-2 py-1 text-sm ${
                          event.price === 0
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200"
                        }`}
                      >
                        {event.price === 0 ? "無料" : `¥${event.price}`}
                      </span>
                    </div>
                  </Link>
                  <Link
                    href={`/events/${event.id}/chat`}
                    className="shrink-0 rounded-lg border border-zinc-200/60 px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    チャット
                  </Link>
                </div>
              </li>
            ))
          )}
        </ul>
      </main>
    </div>
  );
}
