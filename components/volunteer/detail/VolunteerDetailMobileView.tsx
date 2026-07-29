"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
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
  onApply: () => void;
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

function InfoSectionBodyMobile({ sec }: { sec: InfoSection }) {
  if (sec.type === "kv") {
    return (
      <div className="flex flex-col gap-1">
        {sec.kvItems.map(({ k, v }) => (
          <div key={k} className="flex gap-1.5 text-[11px] leading-snug text-[#566358]">
            <span className="w-[3.25rem] shrink-0 font-medium text-[#1A2214]">{k}</span>
            <span className="min-w-0">{v}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-0.5">
      {sec.listItems.map((item) => (
        <li
          key={item}
          className="flex items-start gap-1 text-[11px] leading-snug text-[#566358]"
        >
          <span className="mt-[3px] shrink-0 text-[10px] leading-none text-[#2D7A4F]">•</span>
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function VolunteerDetailMobileView({
  role,
  roleId,
  locationValue,
  applying,
  applyError,
  applySuccessMessage,
  applicationStatus,
  onApply,
}: Props) {
  const [tab, setTab] = useState<Tab>("概要");
  const [avatarError, setAvatarError] = useState(false);

  const { chips } = getDisplayBenefits(role);
  const categoryLabel = getCategoryLabel(role.roleType);
  const isEmergency = role.emergency?.isEmergency === true;
  const activeTo = role.emergency?.activeTo;
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
    <div className="min-[900px]:hidden pb-24">
      <div className="border-b border-[#DDE8DF] bg-white px-3 py-2">
        <Link
          href="/volunteer"
          className="flex w-fit items-center gap-1 text-[13px] font-medium text-[#2D7A4F]"
        >
          <ChevronLeft className="h-4 w-4" />
          ボランティア募集
        </Link>
      </div>

      {/* Compact hero header */}
      <div className="mx-3 mt-2 overflow-hidden rounded-2xl border border-[#e8edd8] bg-white">
        <div className="relative h-[120px] bg-[#f0f4f0]">
          <VolunteerThumbnail
            imageUrl={role.thumbnailUrl}
            alt={role.title}
            roleType={categoryLabel}
            rounded="none"
            className="!absolute !inset-0 !aspect-auto h-full"
          />
          {isEmergency ? (
            <div className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-[6px] bg-[#E53935] px-2.5 py-1 text-[10px] font-bold text-white">
              <AlertTriangle className="h-3 w-3" />
              緊急募集
            </div>
          ) : null}
        </div>
        <div className="px-3 py-2.5">
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            {isEmergency ? (
              <span className="rounded-full bg-[#fde8e8] px-2 py-0.5 text-[10px] font-medium text-[#c62828]">
                緊急
              </span>
            ) : null}
            <span className="rounded-full bg-[#eef5ef] px-2 py-0.5 text-[10px] font-medium text-[#348b38]">
              {categoryLabel}
            </span>
            <span className="rounded-full border border-[#348b38]/35 px-2 py-0.5 text-[10px] font-semibold text-[#348b38]">
              募集中
            </span>
            {chips.map(({ benefit, label }) => (
              <span
                key={benefit}
                className="rounded-full border border-[#DDE8DF] bg-white px-2 py-0.5 text-[10px] text-[#566358]"
              >
                {label}
              </span>
            ))}
          </div>
          <h1 className="mb-1 text-[17px] font-bold leading-[1.3] tracking-[-0.3px] text-[#1A2214]">
            {role.title}
          </h1>
          <p className="mb-1 flex items-center gap-1 text-[11px] text-[#566358]">
            <CalendarDays className="h-3 w-3 shrink-0 text-[#2D7A4F]" />
            {role.dateTime}
          </p>
          <p className="flex items-center gap-1 text-[11px] text-[#566358]">
            <MapPin className="h-3 w-3 shrink-0 text-[#2D7A4F]" />
            {role.location}
          </p>
        </div>
      </div>

      <div className="px-3 pt-3">
        {hasOrganizer ? (
          <div className="mb-3 rounded-[12px] border border-[#DDE8DF] bg-white p-3">
            <div className="flex items-start gap-2.5">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#c8d8b8]">
                {showAvatar ? (
                  <Image
                    src={organizerAvatarUrl!}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="40px"
                    unoptimized
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[15px] font-bold text-[#348b38]">
                    {organizerName.slice(0, 1)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-[#1A2214]">{organizerName}</p>
                {organizerBio ? (
                  <p className="mt-1 line-clamp-2 text-[11.5px] leading-[1.55] text-[#566358]">
                    {organizerBio}
                  </p>
                ) : null}
                {organizerId ? (
                  <Link
                    href={`/organizers/${organizerId}`}
                    className="mt-1.5 inline-flex items-center gap-0.5 text-[12px] font-semibold text-[#348b38]"
                  >
                    主催者のプロフィールを見る
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <div
          role="tablist"
          aria-label="募集セクション"
          className="mb-3 flex border-b-[1.5px] border-[#e0e8d4]"
        >
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "-mb-[1.5px] flex-1 border-b-2 py-2.5 text-center text-[13px] transition-colors",
                tab === t
                  ? "border-[#348b38] font-semibold text-[#348b38]"
                  : "border-transparent font-normal text-[#8a9e80]"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "概要" ? (
          <div className="space-y-2.5">
            <div className="rounded-[12px] border border-[#DDE8DF] bg-white p-3">
              <p className="whitespace-pre-wrap text-[12.5px] leading-[1.7] text-[#2c3c2a]">
                {role.description || "概要はありません。"}
              </p>
            </div>
            <div className="grid grid-cols-2 items-start gap-1.5">
              {infoSections.map((sec) => (
                <div
                  key={sec.title}
                  className="rounded-[10px] border border-[#DDE8DF] bg-white px-2 py-2"
                >
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EAF4ED]">
                      <sec.icon className="h-3 w-3 text-[#2D7A4F]" />
                    </div>
                    <span className="text-[11px] font-semibold leading-none text-[#1A2214]">
                      {sec.title}
                    </span>
                  </div>
                  <InfoSectionBodyMobile sec={sec} />
                </div>
              ))}
            </div>
            {isEmergency ? (
              <div className="flex items-start gap-[10px] rounded-[10px] border border-[#FAEDBB] bg-[#FDF6E3] px-3 py-2 text-[11px] leading-[1.6] text-[#7A5A0A]">
                <AlertCircle className="mt-[1px] h-[15px] w-[15px] shrink-0 text-[#CF9010]" />
                <span>
                  被災地の状況により、活動内容や時間が変更になる場合があります。安全確保を最優先に活動を行います。
                </span>
              </div>
            ) : null}
            <LoginBenefitsBanner returnTo={`/volunteer/${roleId}`} />
          </div>
        ) : null}

        {tab === "会場" && showVenue ? (
          <div className="space-y-3">
            <div className="rounded-[12px] border border-[#DDE8DF] bg-white p-3">
              <p className="text-[13px] font-semibold text-[#1a2818]">{role.location}</p>
            </div>
            <div className="overflow-hidden rounded-[12px] border border-[#e8edd8] bg-white">
              <div className="relative h-[160px] bg-[#e8ede4]">
                <iframe
                  title={`${role.location}の地図`}
                  src={buildEmbedUrl(role.location, role.meetingLat, role.meetingLng)}
                  className="absolute inset-0 h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="flex flex-col gap-2.5 p-3">
                <div className="flex items-start gap-2">
                  <MapPinned className="mt-0.5 h-4 w-4 shrink-0 text-[#348b38]" aria-hidden />
                  <p className="text-[13px] font-semibold text-[#1a2818]">{role.location}</p>
                </div>
                {mapsHref ? (
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-fit items-center gap-1.5 rounded-[10px] border border-[#e0e8d4] px-3 py-2 text-[12px] font-medium text-[#2c3c2a]"
                  >
                    Googleマップで見る
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {tab === "主催者" ? (
          <div className="rounded-[12px] border border-[#DDE8DF] bg-white p-3">
            {hasOrganizer ? (
              <div className="flex items-start gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#c8d8b8]">
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
                  <p className="text-[14px] font-semibold text-[#1A2214]">{organizerName}</p>
                  {role.organizerVerified !== false ? (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-[#B8DFC5] bg-[#EAF4ED] px-[9px] py-[2px] text-[11px] text-[#2D7A4F]">
                      <CheckCircle2 className="h-3 w-3" />
                      本人確認済み
                    </span>
                  ) : null}
                  {organizerBio ? (
                    <p className="mt-2 text-[12.5px] leading-[1.7] text-[#2c3c2a]">{organizerBio}</p>
                  ) : (
                    <p className="mt-2 text-[12.5px] leading-[1.7] text-[#8a9e80]">
                      主催者のプロフィールは準備中です。
                    </p>
                  )}
                  {organizerId ? (
                    <Link
                      href={`/organizers/${organizerId}`}
                      className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-[#348b38]"
                    >
                      主催者のプロフィールを見る
                      <ChevronRight className="h-[13px] w-[13px]" />
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-[#8a9e80]">主催者情報は準備中です。</p>
            )}
          </div>
        ) : null}

        {applyError ? (
          <p className="mt-2 rounded-[8px] bg-red-50 p-3 text-[12px] text-red-600">{applyError}</p>
        ) : null}
      </div>

      {/* Bottom CTA bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#DDE8DF] bg-white/95 px-3 py-2.5 backdrop-blur-sm">
        <div className="mb-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1A2214]">
            <span className="h-2 w-2 rounded-full bg-[#4CAF50]" />
            募集中
          </div>
          {activeTo ? (
            <p className="text-[10px] text-[#566358]">締切：{activeTo}</p>
          ) : null}
        </div>
        {hasApplied ? (
          <div className="rounded-[10px] border border-[#B8DFC5] bg-[#EAF4ED] px-4 py-3 text-center text-[13px] font-semibold text-[#2D7A4F]">
            ✓ 応募済み（{statusLabel}）
          </div>
        ) : (
          <button
            type="button"
            onClick={onApply}
            disabled={applying}
            className="flex w-full items-center justify-between rounded-[10px] bg-[#2D7A4F] px-4 py-3 text-[14px] font-semibold text-white transition hover:bg-[#3D8E61] disabled:opacity-50"
          >
            <span>{applying ? "処理中..." : "この募集に応募する"}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
        {applySuccessMessage ? (
          <p className="mt-1.5 text-center text-[11px] text-[#2D7A4F]">{applySuccessMessage}</p>
        ) : null}
        {role.event || organizerId ? (
          <Link
            href="/messages"
            className="mt-1.5 flex w-full items-center justify-center gap-1.5 py-1.5 text-[12px] font-medium text-[#348b38]"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            主催者に相談する
          </Link>
        ) : null}
      </div>
    </div>
  );
}
