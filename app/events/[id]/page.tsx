import { getEventById, getEventStatus } from "@/lib/events";
import { notFound } from "next/navigation";
import { getTagLabel } from "@/lib/db/types";
import { formatEventDateTime } from "@/lib/format-date";
import { EventDetailClient } from "./event-detail-client";
import { EventThumbnail } from "@/components/event-thumbnail";
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

  const status = getEventStatus(event);
  const isAvailable = status === "available";

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/95">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <Breadcrumb
            items={[
              { label: "トップ", href: "/?mode=select" },
              { label: "イベント一覧", href: "/events" },
              { label: event.title.length > 20 ? `${event.title.slice(0, 20)}…` : event.title },
            ]}
          />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <article className="space-y-10">
          <section className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
            <EventThumbnail
              imageUrl={event.imageUrl}
              alt={event.title}
              rounded="none"
            />
            <div className="bg-white p-6 dark:bg-zinc-900/50">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
                {event.title}
              </h1>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {formatEventDateTime(event.date, event.startTime)}
                {event.endTime && ` 〜 ${event.endTime}`}
              </p>
              <p className="mt-1 font-medium text-zinc-800 dark:text-zinc-200">
                {event.location}
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {event.organizerName}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {event.childFriendly && (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    子連れOK
                  </span>
                )}
                <span
                  className={`rounded px-2 py-0.5 text-xs ${
                    event.price === 0
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {event.price === 0 ? "無料" : `¥${event.price}`}
                </span>
                {event.tags?.map((tagId) => (
                  <span
                    key={tagId}
                    className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                  >
                    {getTagLabel(tagId)}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">説明</h2>
            <p className="mt-2 leading-relaxed text-zinc-700 dark:text-zinc-300">
              {event.description}
            </p>
          </section>

          <section className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900/50">
            <dl className="space-y-5">
            <div>
              <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">日時</dt>
              <dd className="mt-1">
                {event.date} {event.startTime}
                {event.endTime && ` 〜 ${event.endTime}`}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">場所</dt>
              <dd className="mt-1">
                <span className="font-medium">{event.location}</span>
                <br />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">{event.address}</span>
              </dd>
            </div>
            {event.access && (
              <div>
                <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">アクセス</dt>
                <dd className="mt-1 text-sm">{event.access}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">料金</dt>
              <dd className="mt-1">
                {event.price === 0 ? "無料" : `¥${event.price}`}
                {event.priceNote && (
                  <span className="ml-1 text-sm text-zinc-500">（{event.priceNote}）</span>
                )}
              </dd>
            </div>
            {event.itemsToBring && event.itemsToBring.length > 0 && (
              <div>
                <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">持ち物</dt>
                <dd className="mt-1">
                  <ul className="list-inside list-disc text-sm">
                    {event.itemsToBring.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
            {event.rainPolicy && (
              <div>
                <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">雨天時</dt>
                <dd className="mt-1 text-sm">{event.rainPolicy}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">主催者</dt>
              <dd className="mt-1">
                {event.organizerName}
                {event.organizerContact && (
                  <span className="ml-1 text-sm text-zinc-500">（{event.organizerContact}）</span>
                )}
              </dd>
            </div>
            </dl>
          </section>

          <div id="join">
            <EventVolunteerSection eventId={id} />
          </div>
          <SponsorTicketSection
            eventId={id}
            eventTitle={event.title}
            prices={event.sponsorTicketPrices ?? []}
            perks={event.sponsorPerks ?? {}}
          />
          <EventQnASection eventId={id} />
          <div className="space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-700">
            <ShareButton url={`/events/${id}`} title={`${event.title} - 地域イベント`} />
            <EventChatButton eventId={id} />
          </div>
        </article>
      </main>

      {isAvailable && (
        <EventDetailClient
          label="参加・応援する"
          targetId="join"
        />
      )}
    </div>
  );
}
