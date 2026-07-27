"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  AlertTriangle,
  CalendarDays,
  Users,
  Wrench,
  Heart,
  ChevronRight,
  Bookmark,
  MessageCircle,
  AlertCircle,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { VolunteerThumbnail } from "@/components/volunteer-thumbnail";
import { LoginBenefitsBanner } from "@/components/login-benefits-banner";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import {
  getCategoryLabel,
  getDisplayBenefits,
  type VolunteerRoleWithEvent,
} from "@/lib/volunteer-utils";
import { isRecruitmentRowId } from "@/lib/map-recruitment-to-volunteer-role";

type InfoSection =
  | { icon: React.ElementType; title: string; type: "kv"; kvItems: { k: string; v: string }[] }
  | { icon: React.ElementType; title: string; type: "list"; listItems: string[] };

export default function VolunteerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useSupabaseUser();
  const [role, setRole] = useState<VolunteerRoleWithEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [saved, setSaved] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [recruitmentId, setRecruitmentId] = useState<string | null>(null);
  const [applySuccessMessage, setApplySuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchWithTimeout(`/api/volunteer/roles/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Not found"))))
      .then((data: VolunteerRoleWithEvent) => {
        setRole(data);
        const resolvedRecruitmentId =
          data.recruitmentId ?? (isRecruitmentRowId(id) ? id : null);
        setRecruitmentId(resolvedRecruitmentId);
      })
      .catch(() => setError("募集が見つかりません"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user || !recruitmentId) return;
    fetchWithTimeout(`/api/recruitments/${recruitmentId}/my-status`)
      .then((r) => r.json())
      .then((data) => setApplicationStatus(data?.status ?? null))
      .catch(() => setApplicationStatus(null));
  }, [user, recruitmentId]);

  const authDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

  const handleApply = async () => {
    if (!role) return;
    if (!user && !authDisabled) {
      router.push(`/auth?next=${encodeURIComponent(`/volunteer/${id}`)}`);
      return;
    }
    setApplying(true);
    setApplyError(null);
    setApplySuccessMessage(null);
    try {
      const res = await fetchWithTimeout("/api/volunteer/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volunteerRoleId: role.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      if (!res.ok) {
        if (data.status) setApplicationStatus(data.status);
        if (data.recruitmentId) setRecruitmentId(data.recruitmentId);
        setApplyError(data.error ?? "応募に失敗しました");
        return;
      }
      setApplicationStatus(data.status ?? "pending");
      if (data.recruitmentId) setRecruitmentId(data.recruitmentId);
      if (data.formRequired && data.formUrl) {
        router.push(data.formUrl as string);
        return;
      }
      setApplySuccessMessage(
        data.message ?? "応募を受け付けました。主催者の確認をお待ちください。"
      );
    } catch {
      setApplyError("通信に失敗しました");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F8F5]">
        <p className="text-[13px] text-[#566358]">読み込み中...</p>
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#F5F8F5]">
        <p className="text-[13px] text-red-600">{error ?? "募集が見つかりません"}</p>
        <Link href="/volunteer" className="text-[13px] text-[#2D7A4F] underline">
          一覧に戻る
        </Link>
      </div>
    );
  }

  const { chips } = getDisplayBenefits(role);
  const categoryLabel = getCategoryLabel(role.roleType);
  const isEmergency = role.emergency?.isEmergency === true;
  const activeTo = role.emergency?.activeTo;
  const event = role.event;
  const locationValue =
    isEmergency && !user && !authDisabled ? "ログインすると表示します" : role.location;

  // Build activity items from description lines
  const activityItems = (() => {
    const lines = role.description
      .split(/\n|。/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && s.length < 40);
    if (lines.length >= 2) return lines.slice(0, 4);
    return [categoryLabel, ...role.description.slice(0, 60).split("、").slice(0, 3)].filter(Boolean);
  })();

  const conditionItems = [
    role.beginnerFriendly ? "初参加OK" : null,
    role.oneDayOk ? "短時間OK" : null,
    "動きやすい服装",
    "18歳以上推奨",
  ].filter(Boolean) as string[];

  const supportItems =
    chips.length > 0 ? chips.map((c) => c.label) : ["特になし"];

  const infoSections: InfoSection[] = [
    {
      icon: CalendarDays,
      title: "募集概要",
      type: "kv",
      kvItems: [
        { k: "日時", v: role.dateTime },
        { k: "集合場所", v: locationValue },
        { k: "募集人数", v: `${role.capacity}名` },
        { k: "参加費", v: "無料" },
      ],
    },
    {
      icon: Wrench,
      title: "活動内容",
      type: "list",
      listItems: activityItems,
    },
    {
      icon: Users,
      title: "参加条件",
      type: "list",
      listItems: conditionItems,
    },
    {
      icon: Heart,
      title: "提供サポート",
      type: "list",
      listItems: supportItems,
    },
  ];

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
          <li key={item} className="flex items-start gap-[5px] text-[12px] leading-[1.5] text-[#566358]">
            <span className="mt-0.5 shrink-0 text-[#2D7A4F]">•</span>
            {item}
          </li>
        ))}
      </ul>
    );
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
          <li key={item} className="flex items-start gap-1 text-[11px] leading-snug text-[#566358]">
            <span className="mt-[3px] shrink-0 text-[10px] leading-none text-[#2D7A4F]">•</span>
            <span className="min-w-0">{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  const ApplyButton = ({ compact = false }: { compact?: boolean }) => {
    const hasApplied =
      applicationStatus &&
      applicationStatus !== "rejected" &&
      applicationStatus !== "canceled";

    if (hasApplied) {
      const statusLabel =
        applicationStatus === "accepted" || applicationStatus === "confirmed"
          ? "承認済み"
          : applicationStatus === "pending"
            ? "確認中"
            : "応募済み";
      return (
        <div
          className={
            compact
              ? "rounded-[10px] border border-[#B8DFC5] bg-[#EAF4ED] px-4 py-3 text-center text-[13px] font-semibold text-[#2D7A4F]"
              : "rounded-[10px] border border-[#B8DFC5] bg-[#EAF4ED] px-[18px] py-[15px] text-center text-[14px] font-semibold text-[#2D7A4F]"
          }
        >
          ✓ 応募済み（{statusLabel}）
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={handleApply}
        disabled={applying}
        className={
          compact
            ? "flex w-full items-center justify-between rounded-[10px] bg-[#2D7A4F] px-4 py-3 text-[14px] font-semibold text-white transition hover:bg-[#3D8E61] disabled:opacity-50"
            : "flex w-full items-center justify-between rounded-[10px] bg-[#2D7A4F] px-[18px] py-[15px] text-[15px] font-semibold text-white transition hover:bg-[#3D8E61] hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(45,122,79,0.2)] disabled:opacity-50"
        }
      >
        <span>{applying ? "処理中..." : "この募集に応募する"}</span>
        <ChevronRight className={compact ? "h-4 w-4" : "h-[18px] w-[18px]"} />
      </button>
    );
  };

  const ApplicationNotice = () =>
    applySuccessMessage ? (
      <p className="mt-2 rounded-[8px] border border-[#B8DFC5] bg-[#EAF4ED] px-3 py-2.5 text-[12px] leading-relaxed text-[#2D7A4F]">
        {applySuccessMessage}
      </p>
    ) : null;

  const ConsultButton = ({ compact = false }: { compact?: boolean }) =>
    event ? (
      <Link
        href={`/messages`}
        className={
          compact
            ? "flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-[#DDE8DF] bg-white py-2.5 text-[13px] font-medium text-[#1A2214] transition hover:border-[#2D7A4F] hover:text-[#2D7A4F]"
            : "flex w-full items-center justify-center gap-[7px] rounded-[10px] border border-[#DDE8DF] bg-white py-[13px] text-[14px] font-medium text-[#1A2214] transition hover:border-[#2D7A4F] hover:text-[#2D7A4F]"
        }
      >
        <MessageCircle className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        主催者に相談する
      </Link>
    ) : null;

  const OrganizerCard = ({ mobile }: { mobile?: boolean }) =>
    event ? (
      <div
        className={
          mobile
            ? "mb-2 rounded-[12px] border border-[#DDE8DF] bg-white p-3"
            : "rounded-[14px] border border-[#DDE8DF] bg-white p-5"
        }
      >
        {!mobile && (
          <p className="mb-[14px] text-[13px] font-semibold text-[#1A2214]">主催者情報</p>
        )}
        <div className={`flex items-start gap-3 ${mobile ? "mb-[10px]" : "mb-[10px]"}`}>
          <div
            className={`flex shrink-0 items-center justify-center rounded-full border border-[#DDE8DF] bg-[#EAF4ED] ${
              mobile ? "h-10 w-10 text-[18px]" : "h-[50px] w-[50px] text-[22px]"
            }`}
          >
            👤
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`mb-1 font-semibold text-[#1A2214] ${mobile ? "text-[13px]" : "text-[14px]"}`}
            >
              {event.title}
            </p>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#B8DFC5] bg-[#EAF4ED] px-[9px] py-[2px] text-[11px] text-[#2D7A4F]">
              <CheckCircle2 className="h-3 w-3" />
              本人確認済み
            </span>
          </div>
          {mobile && <ChevronRight className="h-4 w-4 shrink-0 text-[#566358] mt-1" />}
        </div>
        {event.prefecture && (
          <p className={`mb-[14px] leading-[1.75] text-[#566358] ${mobile ? "text-[11.5px]" : "text-[12px]"}`}>
            {event.prefecture}を中心に活動しています。
          </p>
        )}
        <Link
          href={`/events/${event.id}`}
          className={`flex w-full items-center justify-between rounded-[8px] border-[1.5px] border-[#B8DFC5] bg-white font-medium text-[#2D7A4F] transition hover:bg-[#EAF4ED] ${
            mobile ? "px-[14px] py-[10px] text-[13px]" : "px-[14px] py-[11px] text-[13px]"
          }`}
        >
          主催者の他の募集を見る
          <ChevronRight className="h-[14px] w-[14px]" />
        </Link>
      </div>
    ) : null;

  const AlertBox = ({ mobile }: { mobile?: boolean }) =>
    isEmergency ? (
      <div
        className={`flex items-start gap-[10px] rounded-[10px] border border-[#FAEDBB] bg-[#FDF6E3] leading-[1.6] text-[#7A5A0A] ${
          mobile ? "mb-2 px-3 py-2 text-[11px]" : "mt-4 px-4 py-3 text-[12px]"
        }`}
      >
        <AlertCircle
          className={`shrink-0 text-[#CF9010] mt-[1px] ${mobile ? "h-[15px] w-[15px]" : "h-4 w-4"}`}
        />
        <span>
          被災地の状況により、活動内容や時間が変更になる場合があります。安全確保を最優先に活動を行います。
        </span>
      </div>
    ) : null;

  return (
    <div className="min-h-screen bg-[#F5F8F5]">
      {/* ── PC (900px+) ── */}
      <div className="hidden min-[900px]:block">
        {/* Breadcrumb */}
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

        {/* Content: 2-col grid */}
        <div className="mx-auto grid max-w-[1100px] grid-cols-[1fr_300px] gap-5 px-7 py-5 pb-10">
          {/* Left column */}
          <div className="min-w-0">
            {/* Hero */}
            <div className="relative mb-4 h-[330px] overflow-hidden rounded-[12px]">
              <div className="absolute inset-0">
                <VolunteerThumbnail
                  imageUrl={role.thumbnailUrl}
                  alt={role.title}
                  roleType={categoryLabel}
                  rounded="none"
                  className="!aspect-auto h-full"
                />
              </div>
              {isEmergency && (
                <div className="absolute left-[14px] top-[14px] z-10 flex items-center gap-[5px] rounded-[6px] bg-[#E53935] px-[14px] py-[6px] text-[12px] font-bold tracking-[0.3px] text-white">
                  <AlertTriangle className="h-[13px] w-[13px]" />
                  緊急募集
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="mb-3 flex flex-wrap gap-[7px]">
              {isEmergency && (
                <span className="rounded-full border border-[#B8DFC5] bg-[#EAF4ED] px-[11px] py-[4px] text-[11px] font-medium text-[#2D7A4F]">
                  緊急
                </span>
              )}
              <span className="rounded-full border border-[#DDE8DF] bg-white px-[11px] py-[4px] text-[11px] text-[#566358]">
                {categoryLabel}
              </span>
              {chips.map(({ benefit, label }) => (
                <span
                  key={benefit}
                  className="rounded-full border border-[#DDE8DF] bg-white px-[11px] py-[4px] text-[11px] text-[#566358]"
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Title */}
            <h1 className="mb-2 text-[24px] font-bold leading-[1.3] tracking-[-0.5px] text-[#1A2214]">
              {role.title}
            </h1>

            {/* Location */}
            <p className="mb-[10px] flex items-center gap-[5px] text-[13px] text-[#566358]">
              <MapPin className="h-[14px] w-[14px] shrink-0 text-[#2D7A4F]" />
              {role.location}
              {event?.prefecture && event.prefecture !== role.location && ` · ${event.prefecture}`}
            </p>

            {/* Description */}
            <p className="mb-[22px] text-[13px] leading-[1.9] text-[#566358]">
              {role.description}
            </p>

            <LoginBenefitsBanner returnTo={`/volunteer/${id}`} />

            {/* 4-col info grid */}
            <div className="mb-4 flex divide-x divide-[#DDE8DF] rounded-[12px] border border-[#DDE8DF] bg-white">
              {infoSections.map((sec) => (
                <div key={sec.title} className="flex-1 min-w-0 px-4 py-5">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EAF4ED]">
                      <sec.icon className="h-[17px] w-[17px] text-[#2D7A4F]" />
                    </div>
                    <span className="text-[13px] font-semibold text-[#1A2214]">{sec.title}</span>
                  </div>
                  <InfoSectionBody sec={sec} />
                </div>
              ))}
            </div>

            <AlertBox />

            {applyError && (
              <p className="mt-3 rounded-[8px] bg-red-50 p-3 text-[12px] text-red-600">{applyError}</p>
            )}
          </div>

          {/* Right sidebar */}
          <div className="sticky top-24 flex flex-col gap-[14px] self-start">
            {/* Apply card */}
            <div className="rounded-[14px] border border-[#DDE8DF] bg-white p-5">
              <div className="mb-[6px] flex items-center gap-[7px] text-[15px] font-semibold text-[#1A2214]">
                <span className="h-[10px] w-[10px] rounded-full bg-[#4CAF50]" />
                募集中
              </div>
              {activeTo ? (
                <p className="mb-4 flex items-center gap-1 text-[12px] text-[#566358]">
                  <CalendarDays className="h-[13px] w-[13px]" />
                  締切：{activeTo}
                </p>
              ) : (
                <div className="mb-4" />
              )}
              <div className="mb-[10px]">
                <ApplyButton />
              </div>
              <ApplicationNotice />
              <div className="mb-4 mt-[10px]">
                <ConsultButton />
              </div>
              <button
                type="button"
                onClick={() => setSaved((v) => !v)}
                className="flex w-full items-center justify-center gap-[7px] py-1 text-[13px] text-[#566358] transition hover:text-[#2D7A4F]"
              >
                <Bookmark
                  className={`h-4 w-4 transition ${saved ? "fill-[#2D7A4F] text-[#2D7A4F]" : ""}`}
                />
                {saved ? "お気に入りに追加済み" : "お気に入りに追加する"}
              </button>
            </div>

            <OrganizerCard />
          </div>
        </div>
      </div>

      {/* ── Mobile (below 900px) ── */}
      <div className="min-[900px]:hidden pb-20">
        {/* Back bar */}
        <div className="border-b border-[#DDE8DF] bg-white px-3 py-2">
          <Link
            href="/volunteer"
            className="flex w-fit items-center gap-1 text-[13px] font-medium text-[#2D7A4F]"
          >
            <ChevronLeft className="h-4 w-4" />
            ボランティア募集
          </Link>
        </div>

        {/* Hero */}
        <div className="relative mx-3 mt-2 mb-2 h-[150px] overflow-hidden rounded-[12px]">
          <div className="absolute inset-0">
            <VolunteerThumbnail
              imageUrl={role.thumbnailUrl}
              alt={role.title}
              roleType={categoryLabel}
              rounded="none"
              className="!aspect-auto h-full"
            />
          </div>
          {isEmergency && (
            <div className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-[6px] bg-[#E53935] px-2.5 py-1 text-[10px] font-bold tracking-[0.3px] text-white">
              <AlertTriangle className="h-3 w-3" />
              緊急募集
            </div>
          )}
        </div>

        <div className="px-3">
          {/* Tags */}
          <div className="mb-2 flex flex-wrap gap-1.5">
            {isEmergency && (
              <span className="rounded-full border border-[#B8DFC5] bg-[#EAF4ED] px-2 py-0.5 text-[10px] font-medium text-[#2D7A4F]">
                緊急
              </span>
            )}
            <span className="rounded-full border border-[#DDE8DF] bg-white px-2 py-0.5 text-[10px] text-[#566358]">
              {categoryLabel}
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

          {/* Title */}
          <h1 className="mb-1 text-[18px] font-bold leading-[1.3] tracking-[-0.3px] text-[#1A2214]">
            {role.title}
          </h1>

          {/* Location */}
          <p className="mb-1.5 flex items-center gap-1 text-[11px] text-[#566358]">
            <MapPin className="h-3 w-3 shrink-0 text-[#2D7A4F]" />
            {role.location}
          </p>

          {/* Description */}
          <p className="mb-2.5 line-clamp-2 text-[11.5px] leading-[1.6] text-[#566358]">
            {role.description}
          </p>

          <div className="mb-2">
            <LoginBenefitsBanner returnTo={`/volunteer/${id}`} />
          </div>

          {/* Status box */}
          <div className="mb-2 flex items-center justify-between rounded-[10px] border border-[#DDE8DF] bg-white px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1A2214]">
              <span className="h-2 w-2 rounded-full bg-[#4CAF50]" />
              募集中
            </div>
            {activeTo && (
              <p className="flex items-center gap-1 text-[10px] text-[#566358]">
                <CalendarDays className="h-3 w-3" />
                締切：{activeTo}
              </p>
            )}
          </div>

          {/* CTA buttons */}
          <div className="mb-2">
            <ApplyButton compact />
          </div>
          <ApplicationNotice />
          <div className="mb-2.5 mt-2">
            <ConsultButton compact />
          </div>

          {/* 2x2 info grid */}
          <div className="mb-2.5 grid grid-cols-2 items-start gap-1.5">
            {infoSections.map((sec) => (
              <div key={sec.title} className="rounded-[10px] border border-[#DDE8DF] bg-white px-2 py-2">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EAF4ED]">
                    <sec.icon className="h-3 w-3 text-[#2D7A4F]" />
                  </div>
                  <span className="text-[11px] font-semibold leading-none text-[#1A2214]">{sec.title}</span>
                </div>
                <InfoSectionBodyMobile sec={sec} />
              </div>
            ))}
          </div>

          <OrganizerCard mobile />

          <AlertBox mobile />

          {applyError && (
            <p className="mt-2 rounded-[8px] bg-red-50 p-3 text-[12px] text-red-600">{applyError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
