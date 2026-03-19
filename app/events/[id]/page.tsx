import { getEventForPublicPage } from "@/lib/get-event-for-page";
import { EventOrganizerCard } from "@/components/events/EventOrganizerCard";
import { OrganizerOtherEventsSection } from "@/components/events/OrganizerOtherEventsSection";
import { getEventStatus } from "@/lib/events";
import { notFound } from "next/navigation";
import { getTagLabel } from "@/lib/db/types";
import { formatEventDateTime } from "@/lib/format-date";
import { getOrganizerStoryForEvent, getReposForEvent } from "@/lib/stories-store";
import { EventDetailClient } from "./event-detail-client";
import { EventDetailTabs } from "./event-detail-tabs";
import { EventDetailCTABlock } from "./event-detail-cta-block";
import { OrganizerContactSection } from "./organizer-contact-section";
import { EventThumbnail } from "@/components/event-thumbnail";
import { EventConsultationCard } from "./event-consultation-card";
import { EventSupportCard } from "./event-support-card";
import { EventVolunteerSection } from "@/components/event-volunteer-section";
import { LoginBenefitsBanner } from "@/components/login-benefits-banner";
import { Breadcrumb } from "@/components/breadcrumb";
import { GlyphSectionTitle } from "@/components/glyph/glyph-section-title";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const event = await getEventForPublicPage(id);

  if (!event) {
    notFound();
  }

  const status = getEventStatus(event);
  const isAvailable = status === "available";
  const organizerStory = getOrganizerStoryForEvent(id);
  const repos = getReposForEvent(id, 3);
  const organizerId = "organizerId" in event ? event.organizerId : null;
  const organizerAvatarUrl = "organizerAvatarUrl" in event ? event.organizerAvatarUrl : null;
  const organizerRegion = "organizerRegion" in event ? event.organizerRegion : null;
  const organizerBio = "organizerBio" in event ? event.organizerBio : null;
  const otherEvents = "otherEvents" in event ? (event.otherEvents ?? []) : [];

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
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {(event.participationMode ?? (event.requiresRegistration ? "required" : "none")) === "required" && (
              <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                申込必須
              </span>
            )}
            {(event.participationMode ?? "none") === "optional" && (
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                申込任意
              </span>
            )}
            {(event.participationMode ?? "none") === "none" && (
              <>
                <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">
                  申込不要
                </span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  当日は会場に直接お越しください
                </span>
              </>
            )}
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

      {/* 主催者に相談する（メインCTAとして強調） */}
      <EventConsultationCard
        eventId={id}
        eventTitle={event.title}
        organizerName={event.organizerName}
      />

      {/* 主CTA + 補助アクション（参加方式に応じて可変） */}
      <EventDetailCTABlock
        eventId={id}
        participationMode={(event.participationMode ?? (event.requiresRegistration ? "required" : "none")) as "required" | "optional" | "none"}
        price={event.price ?? 0}
        isAvailable={isAvailable}
        title={event.title}
        date={event.date}
        startTime={event.startTime}
        endTime={event.endTime}
        address={event.address}
        location={event.location}
        latitude={event.latitude}
        longitude={event.longitude}
      />

      {((event.participationMode ?? "none") === "optional" || (event.participationMode ?? "none") === "none") && (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-6 dark:border-emerald-800/50 dark:bg-emerald-950/20">
          <h2 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            参加方法
          </h2>
          <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-400/80">
            {(event.participationMode ?? "none") === "optional"
              ? "申込なしで当日参加も可能です"
              : "当日は会場に直接お越しください"}
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="font-medium text-zinc-600 dark:text-zinc-400">場所</dt>
              <dd className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">
                {event.location}
              </dd>
              <dd className="text-zinc-600 dark:text-zinc-400">{event.address}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-600 dark:text-zinc-400">日時</dt>
              <dd className="mt-0.5">
                {event.date} {event.startTime}
                {event.endTime && ` 〜 ${event.endTime}`}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-600 dark:text-zinc-400">受付</dt>
              <dd className="mt-0.5">当日会場で受け付け</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-600 dark:text-zinc-400">費用</dt>
              <dd className="mt-0.5">
                {event.price === 0 ? "無料" : `¥${event.price}`}
                {event.priceNote && `（${event.priceNote}）`}
              </dd>
            </div>
            {event.access && (
              <div>
                <dt className="font-medium text-zinc-600 dark:text-zinc-400">アクセス</dt>
                <dd className="mt-0.5">{event.access}</dd>
              </div>
            )}
          </dl>
        </section>
      )}

      <section>
        <GlyphSectionTitle as="h2" className="[&_h2]:text-base [&_h2]:font-medium [&_h2]:text-[var(--mg-muted)]">
          説明
        </GlyphSectionTitle>
        <p className="mt-2 leading-relaxed text-zinc-700 dark:text-zinc-300">
          {event.description}
        </p>
      </section>

      <EventOrganizerCard
        organizerName={event.organizerName}
        organizerId={organizerId ?? undefined}
        organizerAvatarUrl={organizerAvatarUrl ?? undefined}
        organizerRegion={organizerRegion ?? undefined}
        organizerBio={organizerBio ?? undefined}
        eventCount={otherEvents.length}
      />

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
        {event.requiresRegistration && event.registrationDeadline && (
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">申込締切</dt>
            <dd className="mt-1 text-sm">
              {new Date(event.registrationDeadline).toLocaleString("ja-JP", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </dd>
          </div>
        )}
        {event.requiresRegistration && event.registrationNote && (
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">申込メモ・注意事項</dt>
            <dd className="mt-1 text-sm whitespace-pre-wrap">{event.registrationNote}</dd>
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
      <EventSupportCard eventId={id} />

      {otherEvents.length > 0 && (
        <OrganizerOtherEventsSection
          events={otherEvents}
          organizerName={event.organizerName}
          organizerId={organizerId ?? undefined}
        />
      )}
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

      {isAvailable && (event.participationMode ?? (event.requiresRegistration ? "required" : "none")) === "required" && (
        <EventDetailClient requiresRegistration targetId="event-cta" />
      )}
      {isAvailable && (event.participationMode ?? "none") !== "required" && (
        <EventDetailClient
          requiresRegistration={false}
          eventId={id}
          address={event.address}
          location={event.location}
          latitude={event.latitude}
          longitude={event.longitude}
          title={event.title}
          date={event.date}
          startTime={event.startTime}
          endTime={event.endTime}
        />
      )}
    </div>
  );
}
