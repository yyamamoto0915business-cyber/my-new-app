import { getEventById, getEventStatus } from "@/lib/events";
import { notFound } from "next/navigation";
import { getTagLabel } from "@/lib/db/types";
import { formatEventDateTime } from "@/lib/format-date";
import { getOrganizerStoryForEvent, getReposForEvent } from "@/lib/stories-store";
import { EventDetailClient } from "./event-detail-client";
import { EventDetailTabs } from "./event-detail-tabs";
import { OrganizerContactSection } from "./organizer-contact-section";
import { EventThumbnail } from "@/components/event-thumbnail";
import { EventChatButton } from "./event-chat-button";
import { ShareButton } from "@/components/share-button";
import { SponsorTicketSection } from "./sponsor-ticket-section";
import { EventVolunteerSection } from "@/components/event-volunteer-section";
import { EventGiftSection } from "@/components/event-gift-section";
import { LoginBenefitsBanner } from "@/components/login-benefits-banner";
import { Breadcrumb } from "@/components/breadcrumb";
import { GlyphSectionTitle } from "@/components/glyph/glyph-section-title";

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
  const organizerStory = getOrganizerStoryForEvent(id);
  const repos = getReposForEvent(id, 3);

  const overviewContent = (
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
            {event.salonOnly && (
              <span className="rounded bg-[var(--accent)]/20 px-2 py-0.5 text-xs text-[var(--accent)]">
                サロン限定
              </span>
            )}
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
        <GlyphSectionTitle as="h2" className="[&_h2]:text-base [&_h2]:font-medium [&_h2]:text-[var(--mg-muted)]">
          説明
        </GlyphSectionTitle>
        <p className="mt-2 leading-relaxed text-zinc-700 dark:text-zinc-300">
          {event.description}
        </p>
      </section>

      <section className="space-y-5 rounded-xl border p-6 [border-color:var(--mg-line)] bg-white dark:bg-zinc-900/50">
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
        <OrganizerContactSection
          organizerName={event.organizerName}
          organizerContact={event.organizerContact}
          currentPath={`/events/${id}`}
        />
        </dl>
      </section>

      <LoginBenefitsBanner returnTo={`/events/${id}`} />
      <div id="join">
        <EventVolunteerSection eventId={id} returnTo={`/events/${id}`} />
      </div>
      <SponsorTicketSection
        eventId={id}
        eventTitle={event.title}
        prices={event.sponsorTicketPrices ?? []}
        perks={event.sponsorPerks ?? {}}
      />
      <EventGiftSection event={event} />
      <div className="space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-700">
        <ShareButton url={`/events/${id}`} title={`${event.title} - MachiGlyph`} />
        <EventChatButton eventId={id} />
      </div>
    </article>
  );

  return (
    <div className="min-h-screen bg-[var(--mg-paper)]">
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm dark:bg-zinc-900/95 [border-color:var(--mg-line)]">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <Breadcrumb
            items={[
              { label: "トップ", href: "/" },
              { label: "イベント一覧", href: "/events" },
              { label: event.title.length > 20 ? `${event.title.slice(0, 20)}…` : event.title },
            ]}
          />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4">
        <EventDetailTabs
          eventId={id}
          organizerStory={organizerStory}
          repos={repos}
          overviewChildren={overviewContent}
          isAvailable={isAvailable}
        />
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
