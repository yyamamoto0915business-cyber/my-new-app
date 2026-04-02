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
import { EventConsultationCard } from "./event-consultation-card";
import { EventSupportCard } from "./event-support-card";
import { EventVolunteerSection } from "@/components/event-volunteer-section";
import { LoginBenefitsBanner } from "@/components/login-benefits-banner";
import { Breadcrumb } from "@/components/breadcrumb";
import { GlyphSectionTitle } from "@/components/glyph/glyph-section-title";
import { EventDetailHero } from "@/components/events/EventDetailHero";
import { getMapsUrl } from "@/lib/maps-url";
import { Backpack, Route as RouteIcon, FileText, MapPinned } from "lucide-react";
import { CompactEventListSection } from "@/components/events/CompactEventListSection";

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
  const relatedEvents = "relatedEvents" in event ? (event.relatedEvents ?? []) : [];

  const overviewContent = (
    <article className="space-y-10">
      <EventDetailHero event={event} />

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
        hideSave
      />

      {/* 主催者に相談する */}
      <EventConsultationCard
        eventId={id}
        eventTitle={event.title}
        organizerId={organizerId}
        organizerName={event.organizerName}
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

      <section className="space-y-4">
        {event.description && (
          <section className="rounded-[24px] border border-slate-200/90 bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-400" aria-hidden />
              <h2 className="text-[16px] font-semibold text-slate-900">概要</h2>
            </div>
            <div className="mt-3 text-sm leading-7 text-slate-600 whitespace-pre-wrap">
              {event.description}
            </div>
          </section>
        )}

        {(event.itemsToBring?.length || event.rainPolicy || event.registrationNote) ? (
          <section className="rounded-[24px] border border-slate-200/90 bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-2">
              <Backpack className="h-4 w-4 text-slate-400" aria-hidden />
              <h2 className="text-[16px] font-semibold text-slate-900">持ち物・参加条件</h2>
            </div>
            <div className="mt-3 space-y-2">
              {event.itemsToBring && event.itemsToBring.length > 0 && (
                <ul className="space-y-2">
                  {event.itemsToBring.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" aria-hidden />
                      <span className="min-w-0">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {event.rainPolicy && (
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" aria-hidden />
                  <span className="min-w-0">雨天時：{event.rainPolicy}</span>
                </div>
              )}
              {event.requiresRegistration && event.registrationNote && (
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" aria-hidden />
                  <span className="min-w-0 whitespace-pre-wrap">注意事項：{event.registrationNote}</span>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {(event.location || event.address || event.access) && (
          <section className="rounded-[24px] border border-slate-200/90 bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MapPinned className="h-4 w-4 text-slate-400" aria-hidden />
                <h2 className="text-[16px] font-semibold text-slate-900">アクセス</h2>
              </div>
              <a
                href={getMapsUrl({
                  address: event.address || event.location || "",
                  venueName: event.location,
                  latitude: event.latitude,
                  longitude: event.longitude,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors active:bg-slate-50"
              >
                地図を開く
              </a>
            </div>
            <div className="mt-3 space-y-2">
              {event.location && (
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <RouteIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  <span className="min-w-0">{event.location}</span>
                </div>
              )}
              {event.address && (
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <RouteIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  <span className="min-w-0">{event.address}</span>
                </div>
              )}
              {event.access && (
                <div className="mt-1 text-sm leading-7 text-slate-600 whitespace-pre-wrap">
                  {event.access}
                </div>
              )}
            </div>
          </section>
        )}

        <EventOrganizerCard
          organizerName={event.organizerName}
          organizerId={organizerId ?? undefined}
          organizerAvatarUrl={organizerAvatarUrl ?? undefined}
          organizerRegion={organizerRegion ?? undefined}
          organizerBio={organizerBio ?? undefined}
          eventCount={otherEvents.length}
        />
      </section>

      <LoginBenefitsBanner returnTo={`/events/${id}`} />
      <div id="join">
        <EventVolunteerSection eventId={id} returnTo={`/events/${id}`} />
      </div>
      <EventSupportCard eventId={id} />

      {relatedEvents.length > 0 && (
        <CompactEventListSection
          title="関連イベント"
          subtitle="同じテーマや近い地域のイベントです。"
          events={relatedEvents.slice(0, 4)}
          moreHref="/events"
          moreLabel="イベント一覧へ"
          showOrganizerName
        />
      )}

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
      <header className="sticky top-[var(--mg-mobile-top-header-h)] z-50 border-b bg-white/95 backdrop-blur-sm sm:top-0 dark:bg-zinc-900/95 [border-color:var(--mg-line)]">
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
