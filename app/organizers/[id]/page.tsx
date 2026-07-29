import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getOrganizerById } from "@/lib/db/organizers";
import { fetchPublishedEventsByOrganizer } from "@/lib/db/events";
import type { Event } from "@/lib/db/types";
import { EventThumbnail } from "@/components/event-thumbnail";
import { OrganizerAboutTeaser } from "@/components/organizers/OrganizerAboutTeaser";
import { OrganizerProfilePcHero } from "@/components/organizers/OrganizerProfilePcHero";
import { OrganizerProfilePcSidebar } from "@/components/organizers/OrganizerProfilePcSidebar";
import { OrganizerProfilePcEventCard } from "@/components/organizers/OrganizerProfilePcEventCard";
import { OrganizerRemoteImage } from "@/components/organizers/OrganizerRemoteImage";
import { formatEventDate } from "@/lib/format-date";
import { getJstTodayYmd } from "@/lib/jst-date";
import { CATEGORY_LABELS } from "@/lib/categories";
import { getPrimaryCategory } from "@/lib/inferCategory";
import { OrganizerFollowButton } from "./OrganizerFollowButton";
import { buildOrganizerProfileDisplay } from "@/lib/organizer/organizer-display";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

async function fetchParticipantCounts(
  supabase: SupabaseClient,
  eventIds: string[]
): Promise<Record<string, number>> {
  if (eventIds.length === 0) return {};

  const { data } = await supabase
    .from("event_participants")
    .select("event_id")
    .in("event_id", eventIds);

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const eventId = row.event_id as string;
    counts[eventId] = (counts[eventId] ?? 0) + 1;
  }
  return counts;
}

export default async function OrganizerPublicPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  if (!supabase) notFound();

  const [organizer, events] = await Promise.all([
    getOrganizerById(supabase, id),
    fetchPublishedEventsByOrganizer(supabase, id, 50),
  ]);

  if (!organizer) notFound();

  const participantCounts = await fetchParticipantCounts(
    supabase,
    events.map((event) => event.id)
  );

  const today = getJstTodayYmd();
  const upcomingEvents = events
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || "").localeCompare(b.startTime || ""));
  const pastEvents = events
    .filter((e) => e.date < today)
    .sort((a, b) => b.date.localeCompare(a.date) || (b.startTime || "").localeCompare(a.startTime || ""));

  const allDisplayEvents = [
    ...upcomingEvents.map((event) => ({ event, isPast: false as const })),
    ...pastEvents.map((event) => ({ event, isPast: true as const })),
  ];
  const initial = organizer.organizationName.slice(0, 1);
  const totalEventCount = events.length;
  const totalParticipants = Object.values(participantCounts).reduce((sum, count) => sum + count, 0);
  const profileDisplay = buildOrganizerProfileDisplay(organizer, events, organizer.createdAt);

  return (
    <div className="min-h-screen pb-2 lg:pb-12" style={{ background: "#f5f6f1" }}>
      {/* Breadcrumb — PC only */}
      <div className="hidden lg:block max-w-[1100px] mx-auto px-6 pt-5 pb-3">
        <nav className="flex items-center gap-2 text-[13px]" style={{ color: "#98a898" }}>
          <Link href="/" className="hover:text-[#3a8040] transition-colors">ホーム</Link>
          <span className="text-[11px]">›</span>
          <Link href="/organizers" className="hover:text-[#3a8040] transition-colors">主催者一覧</Link>
          <span className="text-[11px]">›</span>
          <span style={{ color: "#3a4a38", fontWeight: 500 }}>
            {organizer.organizationName.length > 20
              ? `${organizer.organizationName.slice(0, 20)}…`
              : organizer.organizationName}
          </span>
        </nav>
      </div>

      {/* Page layout */}
      <div className="lg:max-w-[1100px] lg:mx-auto lg:px-6 pb-2 lg:pb-12 lg:pt-1">

        {/* ─── MOBILE ─── */}
        <div className="flex flex-col gap-2 lg:hidden">
              <div className="relative h-[120px] w-full overflow-hidden" style={{ background: "#c8ddb8" }}>
                {organizer.coverImageUrl?.trim() ? (
                  <OrganizerRemoteImage
                    src={organizer.coverImageUrl}
                    fill
                    className="object-cover"
                    sizes="100vw"
                    priority
                    fallback={<div className="absolute inset-0 bg-gradient-to-br from-[#c8ddb8] to-[#9abf9a]" />}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#c8ddb8] to-[#9abf9a]" />
                )}
              </div>

              <div
                className="relative z-10 mx-3 -mt-6 rounded-[16px] px-3.5 pb-3 pt-3"
                style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full font-bold"
                    style={{ background: "#c8ddb8", fontSize: 20, color: "#3a6030" }}
                  >
                    {organizer.avatarUrl?.trim() ? (
                      <OrganizerRemoteImage
                        src={organizer.avatarUrl}
                        fill
                        className="object-cover"
                        sizes="48px"
                        fallback={<span>{initial}</span>}
                      />
                    ) : (
                      <span>{initial}</span>
                    )}
                  </div>
                  <h1 className="min-w-0 text-[17px] font-bold leading-snug" style={{ color: "#1a2818" }}>
                    {organizer.organizationName}
                  </h1>
                </div>

                {(profileDisplay.heroBio) && (
                  <p className="mt-2 line-clamp-2 text-[12.5px] leading-[1.55]" style={{ color: "#3a4a38" }}>
                    {profileDisplay.heroBio}
                  </p>
                )}

                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {profileDisplay.activityArea && (
                    <StatChip icon={<LocationIcon size={12} />} label="活動地域" value={profileDisplay.activityArea} compact />
                  )}
                  {totalEventCount > 0 && (
                    <StatChip icon={<CalendarIcon size={12} />} label="開催数" value={`${totalEventCount}件`} compact />
                  )}
                </div>

                <div className="mt-3 flex flex-col gap-2">
                  <OrganizerFollowButton fullWidth mobileStyle />
                  <Link
                    href="/messages"
                    className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold transition-all"
                    style={{
                      background: "#fff",
                      color: "#3a8040",
                      border: "1.5px solid #3a8040",
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                    主催者に相談する
                  </Link>
                </div>
              </div>

            <SectionCard
              title="主催イベント"
              icon={<CalendarIcon color="#3a8040" size={16} />}
            >
              {allDisplayEvents.length === 0 ? (
                <EmptyState message="主催イベントはまだありません">
                  <Link href="/events" className="flex items-center gap-0.5 text-[12px] lg:text-[13px]" style={{ color: "#3a8040" }}>
                    イベントを探してみる
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                </EmptyState>
              ) : (
                <div className="flex flex-col gap-2.5 lg:gap-3">
                  {allDisplayEvents.map(({ event, isPast }) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      isPast={isPast}
                      participantCount={participantCounts[event.id]}
                    />
                  ))}
                </div>
              )}
            </SectionCard>

            {profileDisplay.aboutBio && (
              <div
                className="mx-3 rounded-[16px] p-3"
                style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
              >
                <OrganizerAboutTeaser bio={profileDisplay.aboutBio} />
              </div>
            )}

            {organizer.galleryImages.length > 0 && (
              <SectionCard
                title="最近の投稿"
                icon={<GridIcon color="#3a8040" size={16} />}
                seeAll={organizer.galleryImages.length > 6 ? { href: "#", label: "すべて見る" } : undefined}
              >
                <div className="grid grid-cols-3 gap-2">
                  {organizer.galleryImages.slice(0, 6).map((url, idx) => (
                    <div key={`${url}-${idx}`} className="relative aspect-[4/3] rounded-[8px] overflow-hidden" style={{ background: "#e8f5e4" }}>
                      <Image
                        src={url}
                        alt=""
                        fill
                        className="object-cover transition-opacity hover:opacity-90 cursor-pointer"
                        sizes="(max-width: 768px) 33vw, 180px"
                      />
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
        </div>

        {/* ─── PC ─── */}
        <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-4 lg:gap-y-3">
          <OrganizerProfilePcHero
            organizationName={organizer.organizationName}
            avatarUrl={organizer.avatarUrl}
            initial={initial}
            bio={profileDisplay.heroBio}
            totalEventCount={totalEventCount}
            totalParticipants={totalParticipants}
          />

          <OrganizerProfilePcSidebar
            className="row-span-2 self-start lg:sticky lg:top-[72px]"
            activityArea={profileDisplay.activityArea}
            categories={profileDisplay.categories}
            activityStartedAt={profileDisplay.activityStartedAt}
            instagramUrl={organizer.instagramUrl}
            xUrl={organizer.xUrl}
            facebookUrl={organizer.facebookUrl}
            websiteUrl={organizer.websiteUrl}
            publicEmail={organizer.publicEmail}
            publicPhone={organizer.publicPhone}
          />

          <div className="flex flex-col gap-3">
            <SectionCard
              title="主催イベント"
              icon={<CalendarIcon color="#3a8040" size={16} />}
              pcOnly
            >
              {allDisplayEvents.length === 0 ? (
                <EmptyState message="主催イベントはまだありません">
                  <Link href="/events" className="flex items-center gap-0.5 text-[13px]" style={{ color: "#3a8040" }}>
                    イベントを探してみる
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                </EmptyState>
              ) : (
                <div className="flex flex-col gap-2">
                  {allDisplayEvents.map(({ event, isPast }) => (
                    <OrganizerProfilePcEventCard
                      key={event.id}
                      event={event}
                      isPast={isPast}
                      participantCount={participantCounts[event.id]}
                    />
                  ))}
                </div>
              )}
            </SectionCard>

            {profileDisplay.aboutBio && (
              <div
                className="rounded-[16px] p-4"
                style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <PersonIcon color="#3a8040" size={16} />
                  <span className="text-[14px] font-bold" style={{ color: "#1a2818" }}>主催者について</span>
                </div>
                <OrganizerAboutTeaser bio={profileDisplay.aboutBio} variant="section" />
              </div>
            )}

            {organizer.galleryImages.length > 0 && (
              <SectionCard
                title="最近の投稿"
                icon={<GridIcon color="#3a8040" size={16} />}
                seeAll={organizer.galleryImages.length > 6 ? { href: "#", label: "すべて見る" } : undefined}
                pcOnly
              >
                <div className="grid grid-cols-3 gap-2">
                  {organizer.galleryImages.slice(0, 6).map((url, idx) => (
                    <div key={`${url}-${idx}`} className="relative aspect-[4/3] overflow-hidden rounded-[8px]" style={{ background: "#e8f5e4" }}>
                      <Image
                        src={url}
                        alt=""
                        fill
                        className="cursor-pointer object-cover transition-opacity hover:opacity-90"
                        sizes="180px"
                      />
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Reusable sub-components ─── */

function StatChip({
  icon,
  label,
  value,
  compact = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1 ${compact ? "min-w-0 rounded-lg px-2 py-1.5 text-[11px]" : "rounded-full px-3 py-1 text-[12px]"}`}
      style={{ background: "#fff", border: "1px solid #e4ede4", color: "#607060" }}
    >
      <span className="shrink-0">{icon}</span>
      <span className={compact ? "truncate" : undefined}>{label}</span>
      <b
        className={compact ? "truncate" : undefined}
        style={{ color: "#1a2818", fontWeight: 600, marginLeft: compact ? 0 : 2 }}
      >
        {value}
      </b>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  children,
  seeAll,
  pcOnly = false,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  seeAll?: { href: string; label: string };
  pcOnly?: boolean;
}) {
  return (
    <div
      className={`rounded-[16px] p-3 ${pcOnly ? "mx-0 lg:p-4 lg:rounded-[16px]" : "mx-3 lg:mx-0 lg:p-4 lg:rounded-[16px]"}`}
      style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
    >
      <div className="mb-2.5 flex items-center justify-between lg:mb-2.5">
        <div className="flex items-center gap-1.5 lg:gap-2">
          {icon}
          <span
            className={`font-bold ${pcOnly ? "text-[14px]" : "text-[14px]"}`}
            style={{ color: "#1a2818" }}
          >
            {title}
          </span>
        </div>
        {seeAll && (
          <Link
            href={seeAll.href}
            className="flex items-center gap-0.5 text-[12px] lg:gap-1 lg:text-[13px]"
            style={{ color: "#3a8040" }}
          >
            {seeAll.label}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ message, children }: { message: string; children?: React.ReactNode }) {
  return (
    <div
      className="flex flex-col items-center gap-1.5 rounded-[12px] border border-dashed px-3 py-4 lg:gap-2 lg:rounded-[14px] lg:px-4 lg:py-7"
      style={{ background: "#fafcf8", borderColor: "#dce5dc" }}
    >
      <CalendarIcon size={18} color="#98a898" strokeWidth={1.5} />
      <span className="text-center text-[12px] lg:text-[13px]" style={{ color: "#98a898" }}>{message}</span>
      {children}
    </div>
  );
}

function formatEventScheduleLine(event: Event): string {
  const datePart = formatEventDate(event.date);
  if (!event.startTime) return datePart;
  const timePart = event.endTime
    ? `${event.startTime}-${event.endTime}`
    : event.startTime;
  return `${datePart} ${timePart}`;
}

function EventCard({
  event,
  isPast,
  participantCount,
}: {
  event: Event;
  isPast?: boolean;
  participantCount?: number;
}) {
  const category = getPrimaryCategory(event);
  const categoryLabel = category ? CATEGORY_LABELS[category] : null;

  return (
    <Link href={`/events/${event.id}`} className="group flex items-center gap-2.5 lg:gap-3">
      <div
        className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-[8px] lg:h-[100px] lg:w-[130px] lg:rounded-[10px]"
        style={{ background: "#e8f5e4" }}
      >
        <EventThumbnail imageUrl={event.imageUrl} alt={event.title} rounded="none" fill />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap gap-1.5">
          {categoryLabel ? (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ background: "#eef5ef", color: "#3a8040" }}
            >
              {categoryLabel}
            </span>
          ) : null}
          {isPast ? (
            <span
              className="rounded-full px-2 py-0.5 text-[11px]"
              style={{ background: "#f0f0f0", border: "1px solid #ddd", color: "#888" }}
            >
              終了
            </span>
          ) : null}
        </div>
        <h3
          className="mb-0.5 line-clamp-1 text-[13px] font-semibold transition-opacity group-hover:opacity-80 lg:mb-1 lg:line-clamp-2 lg:text-[15px]"
          style={{ color: "#1a2818" }}
        >
          {event.title}
        </h3>
        <div className="flex flex-col gap-px lg:gap-0.5">
          <div className="flex items-center gap-1 text-[11px] lg:gap-1.5 lg:text-[12.5px]" style={{ color: "#607060" }}>
            <CalendarIcon size={12} color="#607060" />
            {formatEventScheduleLine(event)}
          </div>
          <div className="flex items-center gap-1 text-[11px] lg:gap-1.5 lg:text-[12.5px]" style={{ color: "#607060" }}>
            <LocationIcon size={12} color="#607060" />
            <span className="truncate">{event.location}</span>
          </div>
          {participantCount != null && participantCount > 0 ? (
            <div className="flex items-center gap-1 text-[11px] lg:gap-1.5 lg:text-[12.5px]" style={{ color: "#607060" }}>
              <UsersIcon size={12} color="#607060" />
              参加者 {participantCount}人
            </div>
          ) : null}
        </div>
      </div>
      <svg
        className="mt-1 shrink-0 self-start lg:hidden"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#98a898"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}

/* ─── Icon components ─── */

function LocationIcon({ size = 13, color = "#3a8040" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="11" r="3" />
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    </svg>
  );
}

function CalendarIcon({ size = 13, color = "#3a8040", strokeWidth = 1.8 }: { size?: number; color?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function GridIcon({ size = 13, color = "#3a8040" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  );
}

function UsersIcon({ size = 13, color = "#3a8040" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function PersonIcon({ size = 18, color = "#3a8040" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}
