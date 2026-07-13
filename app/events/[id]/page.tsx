import { getEventForPublicPage } from "@/lib/get-event-for-page";
import { OrganizerOtherEventsSection } from "@/components/events/OrganizerOtherEventsSection";
import { getEventStatus } from "@/lib/events";
import { notFound } from "next/navigation";
import { EventDetailTabs } from "./event-detail-tabs";
import { EventPrimaryActions } from "./event-detail-cta-block";
import { Breadcrumb } from "@/components/breadcrumb";
import { CompactEventListSection } from "@/components/events/CompactEventListSection";
import { EventParticipationMethodCards } from "@/components/events/detail/EventParticipationMethodCards";
import { EventDetailAccessBlock } from "@/components/events/detail/EventDetailAccessBlock";
import { MobileEventOverviewTab } from "@/components/events/detail/MobileEventOverviewTab";
import { EventDetailSupportBanner } from "@/components/events/detail/EventDetailSupportBanner";
import { EventDetailSectionCard } from "@/components/events/detail/EventDetailSectionCard";

const SITE_BASE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://my-new-app-self-iota.vercel.app";

type Props = {
  params: Promise<{ id: string }>;
};

function receptionLabel(isAvailable: boolean, status: ReturnType<typeof getEventStatus>) {
  if (!isAvailable) {
    if (status === "ended") return "終了";
    if (status === "full") return "満員";
  }
  return "参加受付中";
}

function participationReceptionText(
  participationMode: "required" | "optional" | "none"
) {
  if (participationMode === "optional") return "当日そのまま参加できます";
  if (participationMode === "none") return "当日そのまま参加できます";
  return "事前申込・当日受付";
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const event = await getEventForPublicPage(id);

  if (!event) {
    notFound();
  }

  const status = getEventStatus(event);
  const isAvailable = status === "available";
  const organizerId = "organizerId" in event ? event.organizerId : null;
  const organizerProfileId =
    "organizerProfileId" in event ? event.organizerProfileId : null;
  const organizerAvatarUrl = "organizerAvatarUrl" in event ? event.organizerAvatarUrl : null;
  const organizerRegion = "organizerRegion" in event ? event.organizerRegion : null;
  const organizerBio = "organizerBio" in event ? event.organizerBio : null;
  const otherEvents = "otherEvents" in event ? (event.otherEvents ?? []) : [];
  const relatedEvents = "relatedEvents" in event ? (event.relatedEvents ?? []) : [];
  const shareUrl = `${SITE_BASE.replace(/\/$/, "")}/events/${id}`;

  const isOrganizerPreview = event.isOrganizerPreview === true;

  const participationModeProp = (event.participationMode ??
    (event.requiresRegistration ? "required" : "none")) as
    | "required"
    | "optional"
    | "none";

  const reception = receptionLabel(isAvailable, status);
  const participationReception = participationReceptionText(participationModeProp);

  const primaryActionsProps = {
    eventId: id,
    participationMode: participationModeProp,
    price: event.price ?? 0,
    isAvailable,
    title: event.title,
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime,
    address: event.address,
    location: event.location,
    latitude: event.latitude,
    longitude: event.longitude,
    hideSave: true,
  };

  const primaryActions = isAvailable ? (
    <EventPrimaryActions {...primaryActionsProps} layout="mobile" />
  ) : null;

  /** PCの参加CTAは EventPurchaseCard に統合済み */
  const pcActions = null;

  const participationNotes =
    event.access || event.registrationNote ? (
      <div className="divide-y divide-[var(--mg-line)] overflow-hidden rounded-lg border border-[var(--mg-line)] bg-zinc-50/40 text-[13px] min-[900px]:rounded-none min-[900px]:border-0 min-[900px]:bg-transparent">
        {event.access ? (
          <div className="px-3.5 py-2.5">
            <p className="text-[10px] font-medium text-[var(--mg-muted)]">アクセス・備考</p>
            <p className="mt-0.5 whitespace-pre-wrap leading-relaxed text-[var(--mg-ink)]">
              {event.access}
            </p>
          </div>
        ) : null}
        {event.registrationNote ? (
          <div className="px-3.5 py-2.5">
            <p className="text-[10px] font-medium text-[var(--mg-muted)]">申込・参加について</p>
            <p className="mt-0.5 whitespace-pre-wrap leading-relaxed text-[var(--mg-ink)]">
              {event.registrationNote}
            </p>
          </div>
        ) : null}
      </div>
    ) : null;

  const participationTabContent = (
    <article className="space-y-3 min-[900px]:space-y-6">
      {/* PC: 参加方法タブ */}
      <div className="hidden min-[900px]:block space-y-4">
        <EventDetailSectionCard title="参加方法" compact>
          <EventParticipationMethodCards
            location={event.location}
            address={event.address}
            date={event.date}
            startTime={event.startTime}
            endTime={event.endTime}
            recurrence={event.recurrence ?? "none"}
            recurrenceCount={event.recurrenceCount}
            receptionLabel={participationReception}
            price={event.price ?? 0}
            priceNote={event.priceNote}
            layout="grid"
            compact
          />
        </EventDetailSectionCard>
        {participationNotes}
        {(event.itemsToBring?.length || event.rainPolicy) && (
          <EventDetailSectionCard title="持ち物・雨天時" compact>
            {event.itemsToBring && event.itemsToBring.length > 0 && (
              <ul className="space-y-2 text-sm text-[var(--mg-muted)]">
                {event.itemsToBring.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-[var(--accent)]" aria-hidden>
                      •
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            )}
            {event.rainPolicy && (
              <p className="mt-2 text-sm text-[var(--mg-muted)]">雨天時：{event.rainPolicy}</p>
            )}
          </EventDetailSectionCard>
        )}
      </div>

      <section className="space-y-2.5 min-[900px]:hidden">
        {/* モバイル: 1枚のリストに集約してスクロール量を抑える */}
        <EventParticipationMethodCards
          className="min-[900px]:hidden"
          layout="list"
          location={event.location}
          address={event.address}
          date={event.date}
          startTime={event.startTime}
          endTime={event.endTime}
          recurrence={event.recurrence ?? "none"}
          recurrenceCount={event.recurrenceCount}
          receptionLabel={participationReception}
          price={event.price ?? 0}
          priceNote={event.priceNote}
        />

        <div className="min-[900px]:hidden">{participationNotes}</div>
      </section>

      {(event.itemsToBring?.length || event.rainPolicy) && (
        <section className="space-y-2 min-[900px]:hidden">
          <h2 className="text-[13px] font-semibold text-[var(--mg-ink)]">持ち物・雨天時</h2>
          <div className="ed-content-card p-3.5">
            {event.itemsToBring && event.itemsToBring.length > 0 && (
              <ul className="space-y-1.5 text-[13px] text-[var(--mg-muted)]">
                {event.itemsToBring.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-[var(--accent)]" aria-hidden>
                      •
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            )}
            {event.rainPolicy && (
              <p className="mt-1.5 text-[13px] text-[var(--mg-muted)]">
                雨天時：{event.rainPolicy}
              </p>
            )}
          </div>
        </section>
      )}

      <div className="min-[900px]:hidden">
        <EventDetailAccessBlock
          location={event.location}
          address={event.address}
          access={event.access}
          latitude={event.latitude}
          longitude={event.longitude}
          showVenueDetails={false}
        />
      </div>
    </article>
  );

  const overviewContent = (
    <div className="min-[900px]:hidden">
      <MobileEventOverviewTab description={event.description} />
    </div>
  );

  return (
    <div className="min-h-screen bg-white min-[900px]:bg-[var(--mg-paper)]">
      {isOrganizerPreview ? (
        <div className="border-b border-amber-200/80 bg-amber-50 px-4 py-2.5 text-center text-[13px] text-amber-900 min-[900px]:text-sm">
          プレビュー表示です。未公開のため、一般ユーザーには表示されません。
        </div>
      ) : null}
      <div className="mx-auto w-full max-w-2xl max-[899px]:max-w-none max-[899px]:px-0 max-[899px]:py-0 px-4 py-4 min-[900px]:max-w-6xl min-[900px]:px-6 min-[900px]:py-4">
        <Breadcrumb
          items={[
            { label: "ホーム", href: "/" },
            { label: "イベント一覧", href: "/events" },
            { label: event.title },
          ]}
          className="mb-3 hidden min-[900px]:flex min-[900px]:flex-nowrap"
        />

        <main className="min-[900px]:pb-0">
          <EventDetailTabs
            eventId={id}
            eventTitle={event.title}
            shareUrl={shareUrl}
            event={event}
            organizerId={organizerId ?? undefined}
            organizerProfileId={organizerProfileId ?? undefined}
            organizerAvatarUrl={organizerAvatarUrl ?? undefined}
            organizerRegion={organizerRegion ?? undefined}
            organizerBio={organizerBio ?? undefined}
            organizerName={event.organizerName}
            primaryActionsSlot={primaryActions}
            pcActionsSlot={pcActions}
            overviewChildren={overviewContent}
            participationChildren={participationTabContent}
            supportBannerSlot={<EventDetailSupportBanner eventId={id} />}
            receptionLabel={reception}
            participationReception={participationReception}
          />

          <div className="mt-8 px-4 min-[900px]:hidden min-[900px]:px-0">
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
          </div>
        </main>
      </div>

    </div>
  );
}
