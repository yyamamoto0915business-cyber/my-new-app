"use client";

import { getOrganizerAccess } from "@/lib/organizer/team";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Crown, HelpCircle, Landmark, UserRound, UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { ProfileBannerAvatar } from "@/components/profile/profile-banner-avatar";
import { OrganizerLogoutButton } from "@/components/organizer/OrganizerLogoutButton";
import { cn } from "@/lib/utils";
import { useOrganizerTeams } from "@/components/organizer/team/OrganizerTeamSwitcher";
import { useOrganizerRole } from "@/hooks/use-organizer-role";
import type { DashboardResponse } from "@/app/api/organizer/dashboard/route";
import { OrgEyebrow, ORG_SERIF } from "@/components/organizer/mobile/organizer-theme";

/** 利用者のマイページと同じ帯の絵（モードを切り替えても同じ形に見えるようにする） */
const MYPAGE_BG = "/profile/mypage-bg.png";
const ORG_GREEN = "#173f2c";
const ORG_GREEN_DARK = "#173f2c";

export type OrganizerSettingsMobileViewProps = {
  planLabel: string;
  slots: string;
  receiving: string | null;
  displayEmail: string;
  displayName: string;
  organizationName: string;
  contactVal: string;
  orgLoading: boolean;
  billingLoading: boolean;
};

type Stats = { listed: number; applications: number; games: number };

/** 主催者の id とアイコン（主催者プロフィールの画像。なければ前の「主催者モードのアイコン」） */
function useOrganizerIdentity(userId: string | undefined) {
  const [organizerId, setOrganizerId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase || !userId) return;
    let cancelled = false;
    (async () => {
      try {
        const access = await getOrganizerAccess(supabase, userId);
        const org = access ? { id: access.organizerId } : null;
        if (cancelled || !org) return;
        setOrganizerId(org.id as string);
        const [{ data: op }, { data: profile }] = await Promise.all([
          supabase.from("organizer_profiles").select("avatar_url").eq("organizer_id", org.id).maybeSingle(),
          supabase.from("profiles").select("organizer_avatar_url").eq("id", userId).maybeSingle(),
        ]);
        if (cancelled) return;
        setAvatarUrl(
          ((op?.avatar_url as string | null) || (profile?.organizer_avatar_url as string | null)) ?? null
        );
      } catch {
        /* アイコンが取れなくても頭文字で出す */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { organizerId, avatarUrl };
}

/** 主催者としての実績（これまでの合計）。ホームの「今日・今やること」の数字とは分ける */
function useOrganizerStats(): Stats | null {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const [dashRes, gamesRes] = await Promise.all([
          fetch("/api/organizer/dashboard", { cache: "no-store", signal: controller.signal }),
          fetch("/api/organizer/games", { cache: "no-store", signal: controller.signal }),
        ]);
        const dash = dashRes.ok ? ((await dashRes.json()) as DashboardResponse) : null;
        const games = gamesRes.ok ? ((await gamesRes.json()) as { games?: unknown[] }) : null;
        // 今を表す数：掲載中（公開中）・新しい申込・作ったゲーム（前の「開いたイベント」は下書きを数えず、0のままに見えた）
        setStats({
          listed: dash?.kpis.hosting ?? 0,
          applications: dash?.kpis.pendingApplications ?? 0,
          games: games?.games?.length ?? 0,
        });
      } catch {
        /* 取れないときは「–」のまま */
      }
    })();
    return () => controller.abort();
  }, []);
  return stats;
}

function StatCell({
  value,
  label,
  href,
  first,
}: {
  value: string;
  label: string;
  href?: string;
  first?: boolean;
}) {
  const className = cn(
    "flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 py-1.5",
    !first && "border-l border-[#eceae3]",
    href && "transition-colors active:bg-[#f6ebc8]"
  );
  const body = (
    <>
      <span className="text-[18px] font-bold tabular-nums tracking-tight text-[#173f2c]" style={{ fontFamily: ORG_SERIF }}>
        {value}
      </span>
      <span className="text-[11px] font-semibold text-[#6b776f]">{label}</span>
    </>
  );
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

function SettingRow({
  href,
  icon,
  title,
  sub,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  sub?: string;
  badge?: { label: string; tone: "ok" | "warn" };
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[56px] items-center gap-3 border-b border-[#f0ede4] px-4 py-2.5 last:border-b-0 active:bg-[#f7f5ee]"
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef4ef]"
        style={{ color: ORG_GREEN }}
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-[#1f2a24]">{title}</span>
          {badge ? (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10.5px] font-bold",
                badge.tone === "ok" ? "bg-[#e3f2e7] text-[#1f7a4a]" : "bg-[#fde9ef] text-[#b84060]"
              )}
            >
              {badge.label}
            </span>
          ) : null}
        </span>
        {sub ? <span className="mt-0.5 block truncate text-[12px] text-[#6b776f]">{sub}</span> : null}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-[#c5c2ba]" aria-hidden />
    </Link>
  );
}

/**
 * 主催者マイページ（スマホ・タブレット）。形は利用者のマイページにそろえ（帯のカード → 数字 → 設定・サポート）、
 * 中身は主催者のこと（主催者のアイコン・プラン・実績・売上の受け取り）にする。
 * プロフィールの入口はカードの「編集」とアイコン、プランの入口はプランのカードにまとめる（一覧で重ねない）。
 */
export function OrganizerSettingsMobileView({
  planLabel,
  slots,
  receiving,
  displayName,
  organizationName,
  orgLoading,
  billingLoading,
}: OrganizerSettingsMobileViewProps) {
  const { user } = useSupabaseUser();
  const { organizerId, avatarUrl } = useOrganizerIdentity(user?.id);
  const stats = useOrganizerStats();

  const orgName = organizationName || (orgLoading ? "" : "団体名が未設定です");
  const receivingOk = receiving === "設定済み";
  const teams = useOrganizerTeams();
  /** 団体のプロフィールを変えられるのはオーナーだけ（メンバーには「編集」を出さない） */
  const canEditProfile = useOrganizerRole() === "owner";
  const currentTeam = teams && teams.teams.length > 1 ? teams.teams.find((t) => t.organizerId === teams.current) : undefined;
  const teamLine = currentTeam ? `使用中：${currentTeam.name}（ここで切りかえ）` : null;

  const num = (n: number | undefined, unit = "") => (stats ? `${n}${unit}` : "–");

  return (
    <div className="mx-auto mt-3 flex w-full max-w-xl flex-col gap-3 pb-4 sm:mt-6 min-[900px]:max-w-[720px] min-[900px]:pb-10">
      {/* 帯のカード（利用者のマイページと同じ形） */}
      <section
        className="relative overflow-hidden rounded-[14px] border border-[#e8e6e0] bg-white"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.04)" }}
      >
        <div className="relative overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src={MYPAGE_BG}
              alt=""
              fill
              priority
              className="object-cover object-[72%_center] saturate-[1.12] contrast-[1.06]"
              sizes="(max-width: 899px) 100vw, 640px"
            />
          </div>
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, #ffffff 0%, rgba(255,255,255,.94) 30%, rgba(255,255,255,.62) 48%, rgba(255,255,255,.18) 68%, transparent 88%)",
            }}
          />
          <div className="relative z-[1] flex items-center justify-between gap-3 px-3 pb-2.5 pt-2.5">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              {(() => {
                const avatar = (
                  <div
                    className="relative h-14 w-14 overflow-hidden rounded-full"
                    style={{ border: "2px solid rgba(255,255,255,.9)", boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}
                  >
                    <ProfileBannerAvatar avatarUrl={avatarUrl} displayName={organizationName || displayName} />
                  </div>
                );
                return canEditProfile ? (
                  <Link href="/organizer/settings/profile" className="relative shrink-0" aria-label="主催者のプロフィールを編集">
                    {avatar}
                  </Link>
                ) : (
                  <span className="relative shrink-0">{avatar}</span>
                );
              })()}
              <div className="min-w-0">
                <p className="text-[9px] font-semibold tracking-[0.22em]" style={{ color: ORG_GREEN_DARK }}>
                  ORGANIZER
                </p>
                {orgLoading ? (
                  <div className="mt-1 h-5 w-32 animate-pulse rounded bg-[#e8ede4]" />
                ) : (
                  <h1
                    className="mt-px truncate text-[17px] font-bold leading-tight text-[#18181a]"
                    style={{ fontFamily: ORG_SERIF }}
                  >
                    {orgName}
                  </h1>
                )}
                {organizerId ? (
                  <Link
                    href={`/organizers/${organizerId}`}
                    className="mt-1 inline-flex items-center gap-0.5 text-[12px] font-semibold"
                    style={{ color: ORG_GREEN_DARK }}
                  >
                    公開ページを見る
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                ) : null}
              </div>
            </div>
            {canEditProfile ? (
              <Link
                href="/organizer/settings/profile"
                className="inline-flex min-h-[30px] shrink-0 items-center gap-1 self-start rounded-full border bg-white px-2.5 py-0.5 text-[11px] font-semibold shadow-sm"
                style={{ borderColor: ORG_GREEN, color: ORG_GREEN_DARK }}
              >
                編集
              </Link>
            ) : null}
          </div>
        </div>

        {/* 主催者としての実績（利用者側の「マイアルバム・フォロワー・フォロー中」の位置） */}
        <div className="relative z-[2] flex items-stretch border-t border-[#eceae3] bg-white">
          <StatCell first value={num(stats?.listed, "件")} label="掲載中" href="/organizer/listings" />
          <StatCell value={num(stats?.applications, "件")} label="新しい申込" href="/organizer/listings?kind=event" />
          <StatCell value={num(stats?.games, "件")} label="ゲーム" href="/organizer/listings?kind=game" />
        </div>
      </section>

      {/* やり残し：売上の受け取りが未設定のときだけ、プランの上に出す */}
      {receiving === "未設定" && !billingLoading ? (
        <Link
          href="/organizer/settings/payouts"
          className="flex items-center gap-3 rounded-[16px] border border-[#e6d29b] bg-[#fbf3e1] px-4 py-3 active:bg-[#f6ebc8]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#173f2c] text-[#f6ebc8]" aria-hidden>
            <Landmark className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] font-bold text-[#173f2c]">売上の受け取りを設定しましょう</span>
            <span className="mt-0.5 block text-[11.5px] leading-snug text-[#7a5d18]">カードやスマホ払いの売上を受け取るには、口座の登録が必要です</span>
          </span>
          <span className="shrink-0 text-[12px] font-bold text-[#173f2c]">設定する ›</span>
        </Link>
      ) : null}

      {/* 現在のプラン（プランの入口はここだけ） */}
      <Link
        href="/organizer/settings/plan"
        className="relative flex items-center gap-3 overflow-hidden rounded-[16px] border border-[#e6e2d6] bg-white px-4 py-3.5 shadow-[0_1px_4px_rgba(23,63,44,0.05)]"
      >
        <span className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#c9a54e] via-[#e6d29b] to-[#c9a54e]" aria-hidden />
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#245a3e] to-[#173f2c] text-[#e6d29b]"
          aria-hidden
        >
          <Crown className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold text-[#a3812f]">いまのプラン</span>
          {billingLoading ? (
            <span className="mt-1 block h-6 w-28 animate-pulse rounded bg-[#f3ecd8]" />
          ) : (
            <>
              <span
                className="block truncate text-[19px] font-bold leading-tight tracking-[0.03em] text-[#173f2c]"
                style={{ fontFamily: ORG_SERIF }}
              >
                {planLabel}
              </span>
              <span className="mt-0.5 block truncate text-[12px] text-[#6b776f]">
                {slots === "無制限" ? "掲載は無制限" : slots === "—" ? "" : `今月の掲載 ${slots}件`}
              </span>
            </>
          )}
        </span>
        <span className="inline-flex shrink-0 items-center text-[12px] font-bold text-[#173f2c]">
          プランを見る
          <ChevronRight className="h-4 w-4" aria-hidden />
        </span>
      </Link>

      {/* 設定・サポート（項目は4つだけなので、たたまずに出す） */}
      <section>
        <div className="mb-1.5 px-1">
          <OrgEyebrow>SETTINGS</OrgEyebrow>
        </div>
        <div className="overflow-hidden rounded-[16px] border border-[#e6e2d6] bg-white shadow-[0_1px_4px_rgba(23,63,44,0.05)]">
          <SettingRow
            href="/organizer/team"
            icon={<UsersRound className="h-4 w-4" />}
            title="チーム・メンバー"
            sub={teamLine ?? "メンバーを招待して、一緒に運営する"}
          />
          <SettingRow
            href="/organizer/settings/payouts"
            icon={<Landmark className="h-4 w-4" />}
            title="売上の受け取り"
            sub="カード売上を口座で受け取る（プランとは別）"
            badge={
              billingLoading
                ? undefined
                : receivingOk
                  ? { label: "設定済み", tone: "ok" }
                  : { label: receiving ?? "未設定", tone: "warn" }
            }
          />
          <SettingRow
            href="/organizer/settings/account"
            icon={<UserRound className="h-4 w-4" />}
            title="アカウント・削除"
            sub="ログインの情報・アカウントの削除"
          />
          <SettingRow href="/contact" icon={<HelpCircle className="h-4 w-4" />} title="ヘルプ・お問い合わせ" />
        </div>
      </section>

      <div className="flex justify-center pt-1">
        <OrganizerLogoutButton variant="quiet" />
      </div>
    </div>
  );
}
