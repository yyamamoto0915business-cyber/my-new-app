"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  AlertTriangle,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  MapPin,
  MapPinned,
  MessageCircle,
} from "lucide-react";
import { VolunteerThumbnail } from "@/components/volunteer-thumbnail";
import { LoginBenefitsBanner } from "@/components/login-benefits-banner";
import {
  getCategoryLabel,
  getDisplayBenefits,
  type VolunteerRoleWithEvent,
} from "@/lib/volunteer-utils";
import { getMapsUrl } from "@/lib/maps-url";
import { cn } from "@/lib/utils";
import {
  buildVolunteerInfoSections,
  hasVenueInfo,
  type InfoSection,
} from "./build-info-sections";

const BASE_TABS = ["概要", "会場", "主催者"] as const;
type Tab = (typeof BASE_TABS)[number];

type Props = {
  role: VolunteerRoleWithEvent;
  roleId: string;
  locationValue: string;
  applying: boolean;
  applyError: string | null;
  applySuccessMessage: string | null;
  applicationStatus: string | null;
  saved: boolean;
  onApply: () => void;
  onToggleSaved: () => void;
};

function buildEmbedUrl(
  location: string,
  latitude?: number | null,
  longitude?: number | null
): string {
  const query =
    latitude != null && longitude != null
      ? `${latitude},${longitude}`
      : location;
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=ja&z=15&output=embed`;
}

function InfoSectionBody({ sec }: { sec: InfoSection }) {
  if (sec.type === "kv") {
    return (
      <div className="flex flex-col gap-2">
        {sec.kvItems.map(({ k, v }) => (
          <div key={k} className="flex gap-[6px] text-[12px] leading-[1.5] text-[#566358]">
            <span className="min-w-[52px] font-medium text-[#1A2214]">{k}</span>
            <span>{v}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-[7px]">
      {sec.listItems.map((item) => (
        <li
          key={item}
          className="flex items-start gap-[5px] text-[12px] leading-[1.5] text-[#566358]"
        >
          <span className="mt-0.5 shrink-0 text-[#2D7A4F]">•</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

export function VolunteerDetailPcView({
  role,
  roleId,
  locationValue,
  applying,
  applyError,
  applySuccessMessage,
  applicationStatus,
  saved,
  onApply,
  onToggleSaved,
}: Props) {
  const [tab, setTab] = useState<Tab>("概要");
  const [avatarError, setAvatarError] = useState(false);

  const { chips } = getDisplayBenefits(role);
  const categoryLabel = getCategoryLabel(role.roleType);
  const isEmergency = role.emergency?.isEmergency === true;
  const activeTo = role.emergency?.activeTo;
  const event = role.event;
  const showVenue = hasVenueInfo(role);
  const infoSections = useMemo(
    () => buildVolunteerInfoSections(role, locationValue),
    [role, locationValue]
  );

  const tabs = useMemo(
    () => (showVenue ? [...BASE_TABS] : (["概要", "主催者"] as Tab[])),
    [showVenue]
  );

  useEffect(() => {
    if (!showVenue && tab === "会場") setTab("概要");
  }, [showVenue, tab]);

  const organizerName = role.organizerName?.trim() || "主催者";
  const organizerId = role.organizerId ?? null;
  const organizerAvatarUrl = role.organizerAvatarUrl?.trim() || null;
  const organizerBio =
    role.organizerBio?.trim() ||
    (role.organizerRegion ? `${role.organizerRegion}を中心に活動しています。` : null);
  const showAvatar = Boolean(organizerAvatarUrl) && !avatarError;
  const hasOrganizer = Boolean(role.organizerName?.trim() || organizerId);

  const mapsHref = getMapsUrl({
    address: role.location,
    venueName: role.location,
    latitude: role.meetingLat ?? undefined,
    longitude: role.meetingLng ?? undefined,
    preferIOS: false,
  });

  const hasApplied =
    applicationStatus &&
    applicationStatus !== "rejected" &&
    applicationStatus !== "canceled";

  const statusLabel =
    applicationStatus === "accepted" || applicationStatus === "confirmed"
      ? "承認済み"
      : applicationStatus === "pending"
        ? "確認中"
        : "応募済み";

  return (
    <div className="hidden min-[900px]:block">
      <div className="border-b border-[#DDE8DF] bg-white px-7 py-[13px]">
        <nav className="flex items-center gap-1.5 text-[12px] text-[#566358]">
          <Link href="/" className="transition-colors hover:text-[#2D7A4F]">
            トップ
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/volunteer" className="transition-colors hover:text-[#2D7A4F]">
            ボランティア募集
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-[#1A2214]">
            {role.title.length > 30 ? `${role.title.slice(0, 30)}…` : role.title}
          </span>
        </nav>
      </div>

      <div className="mx-auto grid max-w-[1100px] grid-cols-[minmax(0,1fr)_320px] items-start gap-5 px-7 py-4 pb-10">
        <div className="min-w-0">
          {/* Hero: 左右分割 */}
          <div className="overflow-hidden rounded-2xl border border-[#e8edd8] bg-white shadow-[0_1px_4px_rgba(44,42,40,0.05)]">
            <div className="grid grid-cols-[minmax(200px,36%)_minmax(0,1fr)] items-stretch">
              <div className="relative min-h-[168px] border-r border-[#e8edd8] bg-[#f0f4f0]">
                <VolunteerThumbnail
                  imageUrl={role.thumbnailUrl}
                  alt={role.title}
                  roleType={categoryLabel}
                  rounded="none"
                  className="!absolute !inset-0 !aspect-auto h-full"
                />
                {isEmergency ? (
                  <div className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-[#E53935]/92 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">
                    <AlertTriangle className="h-3 w-3" />
                    緊急募集
                  </div>
                ) : null}
              </div>

              <div className="flex min-w-0 flex-col justify-center gap-2 px-4 py-3.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  {isEmergency ? (
                    <span className="inline-flex items-center rounded-full bg-[#fde8e8] px-2 py-0.5 text-[11px] font-medium text-[#c62828]">
                      緊急
                    </span>
                  ) : null}
                  <span className="inline-flex items-center rounded-full bg-[#eef5ef] px-2 py-0.5 text-[11px] font-medium text-[#348b38]">
                    {categoryLabel}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-[#348b38]/35 bg-white px-2 py-0.5 text-[11px] font-semibold text-[#348b38]">
                    募集中
                  </span>
                  {chips.map(({ benefit, label }) => (
                    <span
                      key={benefit}
                      className="inline-flex items-center rounded-full border border-[#e0e8d4] bg-[#f5f8f5] px-2 py-0.5 text-[11px] text-[#6a7068]"
                    >
                      {label}
                    </span>
                  ))}
                </div>

                <h1 className="text-[19px] font-bold leading-[1.35] tracking-[-0.02em] text-[#1a2818]">
                  {role.title}
                </h1>

                <p className="flex items-center gap-1.5 text-[12px] font-medium text-[#526448]">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#348b38]" aria-hidden />
                  <span className="line-clamp-1">{role.dateTime}</span>
                </p>

                <p className="flex items-center gap-1.5 text-[12px] text-[#6a7068]">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-[#348b38]" aria-hidden />
                  <span className="line-clamp-1">
                    {role.location}
                    {event?.prefecture && event.prefecture !== role.location
                      ? ` · ${event.prefecture}`
                      : ""}
                  </span>
                </p>

                {role.description ? (
                  <p className="line-clamp-2 text-[12px] leading-[1.6] text-[#6a7068]">
                    {role.description}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4">
            <div
              role="tablist"
              aria-label="募集セクション"
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
              {tab === "概要" ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-[#e8edd8] bg-white p-4">
                    <p className="whitespace-pre-wrap text-[13.5px] leading-[1.75] text-[#2c3c2a]">
                      {role.description || "概要はありません。"}
                    </p>
                  </div>

                  <div className="flex divide-x divide-[#DDE8DF] rounded-2xl border border-[#e8edd8] bg-white">
                    {infoSections.map((sec) => (
                      <div key={sec.title} className="min-w-0 flex-1 px-3.5 py-3.5">
                        <div className="mb-2 flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EAF4ED]">
                            <sec.icon className="h-4 w-4 text-[#2D7A4F]" />
                          </div>
                          <span className="text-[12.5px] font-semibold text-[#1A2214]">
                            {sec.title}
                          </span>
                        </div>
                        <InfoSectionBody sec={sec} />
                      </div>
                    ))}
                  </div>

                  {isEmergency ? (
                    <div className="flex items-start gap-[10px] rounded-[10px] border border-[#FAEDBB] bg-[#FDF6E3] px-4 py-2.5 text-[12px] leading-[1.6] text-[#7A5A0A]">
                      <AlertCircle className="mt-[1px] h-4 w-4 shrink-0 text-[#CF9010]" />
                      <span>
                        被災地の状況により、活動内容や時間が変更になる場合があります。安全確保を最優先に活動を行います。
                      </span>
                    </div>
                  ) : null}

                  <LoginBenefitsBanner returnTo={`/volunteer/${roleId}`} />
                </div>
              ) : null}

              {tab === "会場" && showVenue ? (
                <div className="space-y-4">
                  <div className="space-y-4 rounded-2xl border border-[#e8edd8] bg-white p-4">
                    <div>
                      <p className="text-[13px] font-semibold text-[#1a2818]">{role.location}</p>
                      {event?.prefecture ? (
                        <p className="mt-1 text-[13px] text-[#8a9e80]">{event.prefecture}</p>
                      ) : null}
                    </div>
                  </div>

                  <section>
                    <h2 className="mb-3 text-[14px] font-bold text-[#1a2818]">集合場所へのアクセス</h2>
                    <div className="overflow-hidden rounded-2xl border border-[#e8edd8] bg-white">
                      <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                        <div className="relative min-h-[180px] bg-[#e8ede4]">
                          <iframe
                            title={`${role.location}の地図`}
                            src={buildEmbedUrl(
                              role.location,
                              role.meetingLat,
                              role.meetingLng
                            )}
                            className="absolute inset-0 h-full w-full border-0"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                          />
                        </div>
                        <div className="flex flex-col justify-center gap-3 p-5">
                          <div className="flex items-start gap-2">
                            <MapPinned
                              className="mt-0.5 h-4 w-4 shrink-0 text-[#348b38]"
                              aria-hidden
                            />
                            <div>
                              <p className="text-[13.5px] font-semibold text-[#1a2818]">
                                {role.location}
                              </p>
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
                </div>
              ) : null}

              {tab === "主催者" ? (
                <div className="rounded-2xl border border-[#e8edd8] bg-white p-4">
                  {hasOrganizer ? (
                    <div className="flex items-start gap-3.5">
                      <div className="relative h-[54px] w-[54px] shrink-0 overflow-hidden rounded-full bg-[#c8d8b8]">
                        {showAvatar ? (
                          <Image
                            src={organizerAvatarUrl!}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="54px"
                            unoptimized
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
                        {role.organizerRegion ? (
                          <p className="mt-0.5 text-[12px] text-[#8a9e80]">{role.organizerRegion}</p>
                        ) : null}
                        {role.organizerVerified !== false ? (
                          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-[#B8DFC5] bg-[#EAF4ED] px-[9px] py-[2px] text-[11px] text-[#2D7A4F]">
                            <CheckCircle2 className="h-3 w-3" />
                            本人確認済み
                          </span>
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
                  ) : (
                    <p className="text-[13.5px] text-[#8a9e80]">主催者情報は準備中です。</p>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {applyError ? (
            <p className="mt-3 rounded-[8px] bg-red-50 p-3 text-[12px] text-red-600">{applyError}</p>
          ) : null}
        </div>

        {/* Sidebar: 主催者 → 応募CTA */}
        <aside className="sticky top-[90px] flex flex-col gap-2.5 self-start py-1">
          {hasOrganizer ? (
            <div className="rounded-2xl border border-[#e8edd8] bg-white p-4">
              <div className="flex items-start gap-2.5">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[#c8d8b8]">
                  {showAvatar ? (
                    <Image
                      src={organizerAvatarUrl!}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="48px"
                      unoptimized
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-base font-bold text-[#348b38]">
                      {organizerName.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-[#1a2818]">{organizerName}</p>
                  {organizerBio ? (
                    <p className="mt-1.5 line-clamp-3 text-[12px] leading-[1.6] text-[#526448]">
                      {organizerBio}
                    </p>
                  ) : null}
                  {organizerId ? (
                    <Link
                      href={`/organizers/${organizerId}`}
                      className="mt-2 inline-flex items-center gap-0.5 text-[12.5px] font-semibold text-[#348b38]"
                    >
                      主催者のプロフィールを見る
                      <ChevronRight className="h-3.5 w-3.5 stroke-[2.2]" aria-hidden />
                    </Link>
                  ) : null}
                </div>
              </div>
              {event || organizerId ? (
                <Link
                  href="/messages"
                  className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-[#d5e5d6] bg-white text-[12.5px] font-semibold text-[#348b38] transition hover:bg-[#f4faf6]"
                >
                  <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                  メッセージを送る
                </Link>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-2xl border border-[#e8edd8] bg-white p-4">
            <div className="mb-1 flex items-center gap-2 text-[14px] font-semibold text-[#1a2818]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#4CAF50]" />
              募集中
            </div>
            {activeTo ? (
              <p className="mb-3 flex items-center gap-1 text-[12px] text-[#566358]">
                <CalendarDays className="h-[13px] w-[13px]" />
                締切：{activeTo}
              </p>
            ) : (
              <div className="mb-3" />
            )}

            {hasApplied ? (
              <div className="rounded-[10px] border border-[#B8DFC5] bg-[#EAF4ED] px-[18px] py-[15px] text-center text-[14px] font-semibold text-[#2D7A4F]">
                ✓ 応募済み（{statusLabel}）
              </div>
            ) : (
              <button
                type="button"
                onClick={onApply}
                disabled={applying}
                className="flex w-full items-center justify-between rounded-[10px] bg-[#2D7A4F] px-[18px] py-[15px] text-[15px] font-semibold text-white transition hover:-translate-y-px hover:bg-[#3D8E61] hover:shadow-[0_4px_16px_rgba(45,122,79,0.2)] disabled:opacity-50"
              >
                <span>{applying ? "処理中..." : "この募集に応募する"}</span>
                <ChevronRight className="h-[18px] w-[18px]" />
              </button>
            )}

            {applySuccessMessage ? (
              <p className="mt-2 rounded-[8px] border border-[#B8DFC5] bg-[#EAF4ED] px-3 py-2.5 text-[12px] leading-relaxed text-[#2D7A4F]">
                {applySuccessMessage}
              </p>
            ) : null}

            {(event || organizerId) && !hasOrganizer ? (
              <Link
                href="/messages"
                className="mt-2.5 flex w-full items-center justify-center gap-[7px] rounded-[10px] border border-[#DDE8DF] bg-white py-[13px] text-[14px] font-medium text-[#1A2214] transition hover:border-[#2D7A4F] hover:text-[#2D7A4F]"
              >
                <MessageCircle className="h-4 w-4" />
                主催者に相談する
              </Link>
            ) : null}

            <button
              type="button"
              onClick={onToggleSaved}
              className="mt-3 flex w-full items-center justify-center gap-[7px] py-1 text-[13px] text-[#566358] transition hover:text-[#2D7A4F]"
            >
              <Bookmark
                className={cn("h-4 w-4 transition", saved && "fill-[#2D7A4F] text-[#2D7A4F]")}
              />
              {saved ? "お気に入りに追加済み" : "お気に入りに追加する"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
