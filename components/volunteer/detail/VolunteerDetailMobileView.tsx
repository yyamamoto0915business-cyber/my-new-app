"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  HandHeart,
  MapPin,
  Users,
  Wallet,
  MapPinned,
  MessageCircle,
} from "lucide-react";
import { VolunteerThumbnail } from "@/components/volunteer-thumbnail";
import { DetailImageSwitcher } from "@/components/media/DetailImageSwitcher";
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
} from "./build-info-sections";
/** 下部ナビのアイコン行（safe-area 除く）。Link は min-h-[48px] */
const MOBILE_NAV_ICON_ROW_PX = 48;
/** 下部固定CTAのおおよその高さ（募集中ラベル＋応募ボタン＋相談リンク） */
const MOBILE_VOLUNTEER_CTA_BAR_PX = 128;


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



export function VolunteerDetailMobileView({
  role,
  locationValue,
  applying,
  applyError,
  applySuccessMessage,
  applicationStatus,
  onApply,
}: Props) {
  const [avatarError, setAvatarError] = useState(false);
  const [descOpen, setDescOpen] = useState(false);
  const longDesc = (role.description ?? "").length > 120;
  const hasImage = Boolean(role.thumbnailUrl?.trim() || (role.galleryImages?.length ?? 0) > 0);

  const { chips } = getDisplayBenefits(role);
  const categoryLabel = getCategoryLabel(role.roleType);
  const isEmergency = role.emergency?.isEmergency === true;
  const activeTo = role.emergency?.activeTo;
  const showVenue = hasVenueInfo(role);
  const infoSections = useMemo(
    () => buildVolunteerInfoSections(role, locationValue),
    [role, locationValue]
  );
  const listOf = (title: string) => {
    const sec = infoSections.find((x) => x.title === title);
    return sec && sec.type === "list" ? sec.listItems.filter((x) => x && x !== "特になし") : [];
  };
  const activity = listOf("活動内容");
  const conditions = listOf("参加条件");
  const supports = listOf("提供サポート");



  const organizerName = role.organizerName?.trim() || "主催者";
  const organizerId = role.organizerId ?? null;
  const organizerAvatarUrl = role.organizerAvatarUrl?.trim() || null;
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
    <div
      className="min-[900px]:hidden"
      style={{
        paddingBottom: `calc(${MOBILE_VOLUNTEER_CTA_BAR_PX + MOBILE_NAV_ICON_ROW_PX + 16}px + env(safe-area-inset-bottom, 0px))`,
      }}
    >
      <div className="border-b border-[#DDE8DF] bg-white px-3 py-2">
        <Link
          href="/?kind=volunteer"
          className="flex w-fit items-center gap-1 text-[13px] font-medium text-[#1f6a42]"
        >
          <ChevronLeft className="h-4 w-4" />
          まちの情報
        </Link>
      </div>

      {/* Compact hero header */}
      <div className="mx-3 mt-2 overflow-hidden rounded-[20px] border border-[#e6e2d6] bg-white shadow-[0_2px_12px_rgba(23,63,44,0.06)]">
        {hasImage ? (
        <div className="relative h-[150px] bg-[#f0f4f0]">
          <DetailImageSwitcher
            className="absolute inset-0"
            coverUrl={role.thumbnailUrl}
            galleryImages={role.galleryImages}
            alt={role.title}
            thumbsPlacement="overlay"
            renderMain={(activeUrl) => (
              <VolunteerThumbnail
                imageUrl={activeUrl}
                alt={role.title}
                roleType={categoryLabel}
                rounded="none"
                className="!absolute !inset-0 !aspect-auto h-full"
              />
            )}
          />
          {isEmergency ? (
            <div className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-[6px] bg-[#E53935] px-2.5 py-1 text-[10px] font-bold text-white">
              <AlertTriangle className="h-3 w-3" />
              緊急募集
            </div>
          ) : null}
        </div>
        ) : (
          /* 写真がないとき：深緑の帯に、ボランティアの印と種類を出す（前は絵の下が切れていた） */
          <div className="relative flex h-[76px] items-center gap-3 overflow-hidden bg-gradient-to-br from-[#245a3e] to-[#173f2c] px-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#d9bc6e] bg-[#f6ebc8] text-[#173f2c]">
              <HandHeart className="h-6 w-6" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-[10.5px] font-bold tracking-[0.18em] text-[#d9bc6e]">VOLUNTEER</span>
              <span className="block text-[15px] font-bold text-white">{categoryLabel}のボランティア</span>
            </span>
            {isEmergency ? (
              <span className="absolute right-3 top-3 flex items-center gap-1 rounded-[6px] bg-[#E53935] px-2.5 py-1 text-[10px] font-bold text-white">
                <AlertTriangle className="h-3 w-3" />
                緊急募集
              </span>
            ) : null}
          </div>
        )}
        <div className="px-4 pb-4 pt-3">
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            {isEmergency ? (
              <span className="rounded-full bg-[#fde8e8] px-2 py-0.5 text-[10px] font-medium text-[#c62828]">
                緊急
              </span>
            ) : null}
            <span className="rounded-full bg-[#173f2c] px-2.5 py-0.5 text-[11px] font-bold text-[#f6ebc8]">
              募集中
            </span>
            <span className="rounded-full bg-[#eef5f0] px-2.5 py-0.5 text-[11px] font-semibold text-[#1f6a42]">
              {categoryLabel}
            </span>
            {chips.map(({ benefit, label }) => (
              <span
                key={benefit}
                className="rounded-full border border-[#e6dcc0] bg-[#fffbf0] px-2.5 py-0.5 text-[11px] font-semibold text-[#8a6d1f]"
              >
                {label}
              </span>
            ))}
          </div>
          <h1
            className="mb-3 text-[19px] font-semibold leading-[1.45] tracking-[0.02em] text-[#163828]"
            style={{ fontFamily: "var(--font-serif-display), 'Shippori Mincho', 'Noto Serif JP', serif" }}
          >
            {role.title}
          </h1>
          {/* 大事なことを4つの小さな欄にまとめる（日時・場所・人数・参加費） */}
          <dl className="grid grid-cols-2 gap-1.5">
            {[
              { Icon: CalendarDays, k: "日時", v: role.dateTime },
              { Icon: MapPin, k: "場所", v: role.location },
              { Icon: Users, k: "募集人数", v: role.capacity ? `${role.capacity}名` : "—" },
              { Icon: Wallet, k: "参加費", v: "無料" },
            ].map(({ Icon, k, v }) => (
              <div key={k} className="flex min-w-0 items-start gap-1.5 rounded-[12px] bg-[#f7f6f2] px-2.5 py-2">
                <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1f6a42]" aria-hidden />
                <div className="min-w-0">
                  <dt className="text-[10px] font-bold text-[#8a968c]">{k}</dt>
                  <dd className="line-clamp-2 text-[12.5px] font-semibold leading-snug text-[#1f2a24]">{v}</dd>
                </div>
              </div>
            ))}
          </dl>
          {showVenue && mapsHref ? (
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-[#1f6a42]"
            >
              <MapPinned className="h-3.5 w-3.5" aria-hidden />
              地図で場所を見る
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          ) : null}
          {/* 主催者は、別のカードにせず1行で */}
          {hasOrganizer ? (
            <div className="mt-3 flex items-center gap-2.5 border-t border-[#f0ede4] pt-3">
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[#c8d8b8]">
                {showAvatar ? (
                  <Image src={organizerAvatarUrl!} alt="" fill className="object-cover" sizes="32px" unoptimized onError={() => setAvatarError(true)} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[13px] font-bold text-[#1f6a42]">{organizerName.slice(0, 1)}</div>
                )}
              </div>
              <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#1A2214]">
                <span className="mr-1 text-[11px] font-bold text-[#8a968c]">主催</span>
                {organizerName}
              </p>
              {organizerId ? (
                <Link href={`/organizers/${organizerId}`} className="inline-flex shrink-0 items-center text-[12px] font-bold text-[#1f6a42]">
                  プロフィール
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-2.5 px-3 pt-3">
        {/* 募集の内容（長いときは4行でたたむ） */}
        <section className="rounded-[16px] border border-[#e6e2d6] bg-white p-4">
          <h2 className="mb-1.5 text-[13px] font-bold text-[#173f2c]">募集の内容</h2>
          <p className={cn("whitespace-pre-wrap text-[14px] leading-[1.8] text-[#2c3c2a]", longDesc && !descOpen && "line-clamp-4")}>
            {role.description || "概要はありません。"}
          </p>
          {longDesc ? (
            <button
              type="button"
              onClick={() => setDescOpen((v) => !v)}
              className="mt-1.5 text-[13px] font-bold text-[#1f6a42] underline underline-offset-2"
            >
              {descOpen ? "閉じる" : "続きを読む"}
            </button>
          ) : null}
        </section>

        {activity && activity.length > 0 ? (
          <section className="rounded-[16px] border border-[#e6e2d6] bg-white p-4">
            <h2 className="mb-1.5 text-[13px] font-bold text-[#173f2c]">活動内容</h2>
            <ul className="space-y-1">
              {activity.map((item) => (
                <li key={item} className="flex items-start gap-1.5 text-[13.5px] leading-relaxed text-[#3c4a40]">
                  <span className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a54e]" aria-hidden />
                  <span className="min-w-0">{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* 参加条件と提供サポートは、小さな札でまとめて1枚に */}
        {conditions.length > 0 || supports.length > 0 ? (
          <section className="space-y-2.5 rounded-[16px] border border-[#e6e2d6] bg-white p-4">
            {conditions.length > 0 ? (
              <div>
                <h2 className="mb-1.5 text-[12px] font-bold text-[#8a968c]">参加条件</h2>
                <ul className="flex flex-wrap gap-1.5">
                  {conditions.map((c) => (
                    <li key={c} className="rounded-full bg-[#eef5f0] px-2.5 py-1 text-[12px] font-semibold text-[#1f6a42]">{c}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {supports.length > 0 ? (
              <div>
                <h2 className="mb-1.5 text-[12px] font-bold text-[#8a968c]">提供サポート</h2>
                <ul className="flex flex-wrap gap-1.5">
                  {supports.map((c) => (
                    <li key={c} className="rounded-full border border-[#e6dcc0] bg-[#fffbf0] px-2.5 py-1 text-[12px] font-semibold text-[#8a6d1f]">{c}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        {isEmergency ? (
          <div className="flex items-start gap-[10px] rounded-[12px] border border-[#FAEDBB] bg-[#FDF6E3] px-3 py-2 text-[12px] leading-[1.6] text-[#7A5A0A]">
            <AlertCircle className="mt-[1px] h-[15px] w-[15px] shrink-0 text-[#CF9010]" />
            <span>被災地の状況により、活動内容や時間が変更になる場合があります。安全確保を最優先に活動を行います。</span>
          </div>
        ) : null}

        {applyError ? (
          <p className="mt-2 rounded-[8px] bg-red-50 p-3 text-[12px] text-red-600">{applyError}</p>
        ) : null}
      </div>

      {/* Bottom CTA bar */}
      <div
        className="fixed inset-x-0 z-40 border-t border-[#DDE8DF] bg-white/95 px-3 py-2.5 backdrop-blur-sm min-[900px]:hidden"
        style={{
          bottom: `calc(${MOBILE_NAV_ICON_ROW_PX}px + env(safe-area-inset-bottom, 0px))`,
        }}
      >
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
          <div className="rounded-[10px] border border-[#B8DFC5] bg-[#EAF4ED] px-4 py-3 text-center text-[13px] font-semibold text-[#1f6a42]">
            ✓ 応募済み（{statusLabel}）
          </div>
        ) : (
          <button
            type="button"
            onClick={onApply}
            disabled={applying}
            className="flex w-full items-center justify-between rounded-[14px] border-[1.5px] border-[#d9bc6e] bg-gradient-to-b from-[#245a3e] to-[#173f2c] px-4 py-3 text-[15px] font-bold text-[#f6ebc8] shadow-[0_4px_12px_rgba(14,42,29,0.2)] transition disabled:opacity-50"
          >
            <span>{applying ? "処理中..." : "この募集に応募する"}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
        {applySuccessMessage ? (
          <p className="mt-1.5 text-center text-[11px] text-[#1f6a42]">{applySuccessMessage}</p>
        ) : null}
        {role.event || organizerId ? (
          <Link
            href="/messages"
            className="mt-1.5 flex w-full items-center justify-center gap-1.5 py-1.5 text-[12px] font-medium text-[#1f6a42]"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            主催者に相談する
          </Link>
        ) : null}
      </div>
    </div>
  );
}
