import Link from "next/link";
import { getEventById } from "@/lib/events";
import { notFound } from "next/navigation";
import { getTagLabel } from "@/lib/db/types";
import { EventChatButton } from "./event-chat-button";
import { ShareButton } from "@/components/share-button";
import { SponsorTicketSection } from "./sponsor-ticket-section";
import { EventQnASection } from "@/components/event-qna-section";
import { EventVolunteerSection } from "@/components/event-volunteer-section";
import { Breadcrumb } from "@/components/breadcrumb";

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
          <Breadcrumb
            items={[
              { label: "トップ", href: "/?mode=select" },
              { label: "イベント一覧", href: "/events" },
              { label: event.title.length > 24 ? `${event.title.slice(0, 24)}…` : event.title },
            ]}
          />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <article className="rounded-2xl border border-zinc-200/60 bg-white/80 p-6 shadow-lg backdrop-blur-sm dark:border-zinc-700/60 dark:bg-zinc-900/80">
          <h1 className="text-2xl font-bold">{event.title}</h1>
          {event.tags && event.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {event.tags.map((tagId) => (
                <span
                  key={tagId}
                  className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                >
                  {getTagLabel(tagId)}
                </span>
              ))}
            </div>
          )}
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
          <EventVolunteerSection eventId={id} />
          <SponsorTicketSection
            eventId={id}
            eventTitle={event.title}
            prices={event.sponsorTicketPrices ?? []}
            perks={event.sponsorPerks ?? {}}
          />
          <EventQnASection eventId={id} />
          <div className="mt-6 space-y-6 border-t border-zinc-200 pt-6 dark:border-zinc-700">
            <ShareButton
              url={`/events/${id}`}
              title={`${event.title} - 地域イベント`}
            />
            <EventChatButton eventId={id} />
          </div>
        </article>
      </main>
    </div>
  );
}
