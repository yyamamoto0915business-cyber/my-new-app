"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ExternalLink, MapPinned, ChevronRight } from "lucide-react";
import type { Event } from "@/lib/db/types";
import { getMapsUrl } from "@/lib/maps-url";
import { EventDetailPcVolunteerInfoTab } from "@/components/events/detail/pc/EventDetailPcVolunteerInfoTab";
import type { EventVolunteerRecruitment } from "@/hooks/use-event-volunteer-recruitment";
import { cn } from "@/lib/utils";

const BASE_TABS = ["概要", "会場", "主催者"] as const;
const VOLUNTEER_TAB = "ボランティア情報" as const;
type BaseTab = (typeof BASE_TABS)[number];
type PcTab = BaseTab | typeof VOLUNTEER_TAB;

type Props = {
  eventId: string;
  event: Event;
  organizerId?: string;
  organizerAvatarUrl?: string;
  organizerRegion?: string;
  organizerBio?: string;
  organizerName: string;
  hasVolunteerRecruitment?: boolean;
  recruitment?: EventVolunteerRecruitment | null;
};

const cardClass = "rounded-2xl border border-[#e8edd8] bg-white p-4";

function buildEmbedUrl(
  location: string,
  address: string,
  latitude?: number | null,
  longitude?: number | null
): string {
  const query =
    latitude != null && longitude != null
      ? `${latitude},${longitude}`
      : [location, address].filter(Boolean).join(" ");
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=ja&z=15&output=embed`;
}

export function EventDetailPcMainSections({
  eventId,
  event,
  organizerId,
  organizerAvatarUrl,
  organizerRegion,
  organizerBio,
  organizerName,
  hasVolunteerRecruitment = false,
  recruitment = null,
}: Props) {
  const [tab, setTab] = useState<PcTab>("概要");
  const [avatarError, setAvatarError] = useState(false);
  const showOrganizerAvatar = organizerAvatarUrl && !avatarError;

  const tabs = useMemo(
    () =>
      hasVolunteerRecruitment
        ? ([...BASE_TABS, VOLUNTEER_TAB] as const)
        : ([...BASE_TABS] as const),
    [hasVolunteerRecruitment]
  );

  useEffect(() => {
    if (!hasVolunteerRecruitment && tab === VOLUNTEER_TAB) {
      setTab("概要");
    }
  }, [hasVolunteerRecruitment, tab]);

  const mapsHref = getMapsUrl({
    address: event.address || event.location,
    venueName: event.location,
    latitude: event.latitude ?? undefined,
    longitude: event.longitude ?? undefined,
    preferIOS: false,
  });

  return (
    <div className="mt-4">
      <div
        role="tablist"
        aria-label="イベントセクション"
        className="flex border-b-[1.5px] border-[#e0e8d4]"
      >
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "-mb-[1.5px] border-b-2 px-4 py-2.5 text-[13.5px] whitespace-nowrap transition-colors first:pl-0",
              tab === t
                ? "border-[#348b38] font-semibold text-[#348b38]"
                : "border-transparent font-normal text-[#8a9e80] hover:text-[#2c3c2a]"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="pt-4">
        {tab === "概要" && (
          <div className={cardClass}>
            <p className="whitespace-pre-wrap text-[13.5px] leading-[1.75] text-[#2c3c2a]">
              {event.description ?? "概要はありません。"}
            </p>
          </div>
        )}

        {tab === VOLUNTEER_TAB && hasVolunteerRecruitment ? (
          <EventDetailPcVolunteerInfoTab eventId={eventId} event={event} recruitment={recruitment} />
        ) : null}

        {tab === "会場" && (
          <div className={cn(cardClass, "space-y-4")}>
            <div>
              <p className="text-[13px] font-semibold text-[#1a2818]">{event.location}</p>
              {event.address ? (
                <p className="mt-1 text-[13px] text-[#8a9e80]">{event.address}</p>
              ) : null}
            </div>
            {event.access ? (
              <div>
                <p className="text-[12px] font-medium text-[#8a9e80]">アクセス・備考</p>
                <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-[1.7] text-[#2c3c2a]">
                  {event.access}
                </p>
              </div>
            ) : null}
            {(event.itemsToBring?.length || event.rainPolicy) && (
              <div>
                {event.itemsToBring && event.itemsToBring.length > 0 ? (
                  <>
                    <p className="text-[12px] font-medium text-[#8a9e80]">持ち物</p>
                    <ul className="mt-1 space-y-1 text-[13.5px] text-[#2c3c2a]">
                      {event.itemsToBring.map((item) => (
                        <li key={item}>・{item}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
                {event.rainPolicy ? (
                  <p className="mt-2 text-[13.5px] text-[#2c3c2a]">
                    雨天時：{event.rainPolicy}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        )}

        {tab === "主催者" && (
          <div className={cardClass}>
            <div className="flex items-start gap-3.5">
              <div className="relative h-[54px] w-[54px] shrink-0 overflow-hidden rounded-full bg-[#c8d8b8]">
                {showOrganizerAvatar ? (
                  <Image
                    src={organizerAvatarUrl!}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="54px"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-bold text-[#348b38]">
                    {organizerName.slice(0, 1)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-[#1a2818]">{organizerName}</p>
                {organizerRegion ? (
                  <p className="mt-0.5 text-[12px] text-[#8a9e80]">{organizerRegion}</p>
                ) : null}
                {organizerBio ? (
                  <p className="mt-2 text-[13.5px] leading-[1.7] text-[#2c3c2a]">
                    {organizerBio}
                  </p>
                ) : (
                  <p className="mt-2 text-[13.5px] leading-[1.7] text-[#8a9e80]">
                    主催者のプロフィールは準備中です。
                  </p>
                )}
                {organizerId ? (
                  <Link
                    href={`/organizers/${organizerId}`}
                    className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-[#348b38]"
                  >
                    主催者のプロフィールを見る
                    <ChevronRight className="h-[13px] w-[13px] stroke-[2.2]" aria-hidden />
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 会場へのアクセス — タブ下に常時表示 */}
      {(event.location || event.address) && (
        <section className="mt-6">
          <h2 className="mb-3 text-[14px] font-bold text-[#1a2818]">会場へのアクセス</h2>
          <div className="overflow-hidden rounded-2xl border border-[#e8edd8] bg-white">
            <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
              <div className="relative min-h-[180px] bg-[#e8ede4]">
                <iframe
                  title={`${event.location}の地図`}
                  src={buildEmbedUrl(
                    event.location,
                    event.address ?? "",
                    event.latitude,
                    event.longitude
                  )}
                  className="absolute inset-0 h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="flex flex-col justify-center gap-3 p-5">
                <div className="flex items-start gap-2">
                  <MapPinned className="mt-0.5 h-4 w-4 shrink-0 text-[#348b38]" aria-hidden />
                  <div>
                    <p className="text-[13.5px] font-semibold text-[#1a2818]">
                      {event.location}
                    </p>
                    {event.address ? (
                      <p className="mt-1 text-[12.5px] leading-relaxed text-[#8a9e80]">
                        {event.address}
                      </p>
                    ) : null}
                  </div>
                </div>
                {mapsHref ? (
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-fit items-center gap-1.5 rounded-[10px] border border-[#e0e8d4] bg-white px-3.5 py-2 text-[12.5px] font-medium text-[#2c3c2a] transition hover:border-[#348b38] hover:text-[#348b38]"
                  >
                    Googleマップで見る
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
