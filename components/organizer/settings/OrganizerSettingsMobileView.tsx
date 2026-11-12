"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronRight, Crown, HelpCircle, Landmark, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { ProfileBannerAvatar } from "@/components/profile/profile-banner-avatar";
import { OrganizerLogoutButton } from "@/components/organizer/OrganizerLogoutButton";
import { cn } from "@/lib/utils";
import type { DashboardResponse } from "@/app/api/organizer/dashboard/route";

/** 利用者のマイページと同じ帯の絵（モードを切り替えても同じ形に見えるようにする） */
const MYPAGE_BG = "/profile/mypage-bg.png";
const ORG_GREEN = "#2f7d4e";
const ORG_GREEN_DARK = "#1f5e3a";

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

type Stats = { events: number; participants: number; games: number };

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
        const { data: org } = await supabase
          .from("organizers")
          .select("id")
          .eq("profile_id", userId)
          .maybeSingle();
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
        // 公開したことのあるイベント（公開中・終了）。下書き・アーカイブは数えない
        const opened = (dash?.events ?? []).filter(
          (e) => e.visibilityStatus === "published" && (e.status === "public" || e.status === "ended")
        );
        setStats({
          events: opened.length,
          participants: opened.reduce((sum, e) => sum + (e.participantCount || 0), 0),
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
    href && "transition-colors active:bg-[#eaf4ee]"
  );
  const body = (
    <>
      <span className="text-[17px] font-semibold tabular-nums tracking-tight text-[#18181a]">{value}</span>
      <span className="text-[11px] text-[#8c8a84]">{label}</span>
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
      className="flex min-h-[52px] items-center gap-3 border-b border-[#eceae3] px-4 py-2.5 last:border-b-0 active:bg-[#fafaf8]"
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e6f3ea]"
        style={{ color: ORG_GREEN }}
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[14px] font-medium text-[#18181a]">{title}</span>
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
        {sub ? <span className="mt-0.5 block truncate text-[11.5px] text-[#8c8a84]">{sub}</span> : null}
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
  displayEmail,
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
  // 売上の受け取りが「未設定」のときは、気づけるように最初から開いておく（「決済未対応」は本人の設定もれではないので開かない）
  const needsPayoutSetup = !billingLoading && receiving === "未設定";
  const [settingsOpen, setSettingsOpen] = useState(false);
  useEffect(() => {
    if (needsPayoutSetup) setSettingsOpen(true);
  }, [needsPayoutSetup]);

  const num = (n: number | undefined, unit = "") => (stats ? `${n}${unit}` : "–");

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3 pb-4 min-[900px]:hidden">
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
              <Link href="/organizer/settings/profile" className="relative shrink-0" aria-label="主催者のプロフィールを編集">
                <div
                  className="relative h-14 w-14 overflow-hidden rounded-full"
                  style={{ border: "2px solid rgba(255,255,255,.9)", boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}
                >
                  <ProfileBannerAvatar avatarUrl={avatarUrl} displayName={organizationName || displayName} />
                </div>
              </Link>
              <div className="min-w-0">
                <p className="text-[9px] font-semibold tracking-[0.22em]" style={{ color: ORG_GREEN_DARK }}>
                  ORGANIZER
                </p>
                {orgLoading ? (
                  <div className="mt-1 h-5 w-32 animate-pulse rounded bg-[#e8ede4]" />
                ) : (
                  <h1
                    className="mt-px truncate text-[17px] font-bold leading-tight text-[#18181a]"
                    style={{ fontFamily: "'Noto Serif JP', serif" }}
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
            <Link
              href="/organizer/settings/profile"
              className="inline-flex min-h-[30px] shrink-0 items-center gap-1 self-start rounded-full border bg-white px-2.5 py-0.5 text-[11px] font-semibold shadow-sm"
              style={{ borderColor: ORG_GREEN, color: ORG_GREEN_DARK }}
            >
              編集
            </Link>
          </div>
        </div>

        {/* 主催者としての実績（利用者側の「マイアルバム・フォロワー・フォロー中」の位置） */}
        <div className="relative z-[2] flex items-stretch border-t border-[#eceae3] bg-white">
          <StatCell first value={num(stats?.events)} label="開いたイベント" href="/organizer/events" />
          <StatCell value={num(stats?.participants, "人")} label="のべ参加者" />
          <StatCell value={num(stats?.games)} label="作ったゲーム" href="/organizer/games" />
        </div>
      </section>

      {/* 現在のプラン（プランの入口はここだけ。上の行のプラン名マークからも行ける） */}
      <Link
        href="/organizer/settings/plan"
        className="flex items-center gap-3 rounded-[14px] border border-[#f0dfb6] bg-[#fffaf0] px-4 py-3 active:scale-[0.99]"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fdf0cf] text-[#b07a1c]" aria-hidden>
          <Crown className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] text-[#8a7650]">現在のプラン</span>
          {billingLoading ? (
            <span className="mt-1 block h-6 w-28 animate-pulse rounded bg-[#f3e6c4]" />
          ) : (
            <>
              <span className="block truncate text-[18px] font-bold text-[#3a2c10]">{planLabel}</span>
              <span className="block truncate text-[12px] font-bold text-[#4a8a2e]">{slots}</span>
            </>
          )}
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-[#3a2c10]" aria-hidden />
      </Link>

      {/* 設定・サポート（利用者のマイページと同じく開いて使う） */}
      <section
        className="overflow-hidden rounded-[14px] border border-[#e8e6e0] bg-white"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.04)" }}
      >
        <button
          type="button"
          onClick={() => setSettingsOpen((v) => !v)}
          className="flex min-h-[48px] w-full items-center justify-between px-4 py-3 text-left"
          aria-expanded={settingsOpen}
        >
          <span className="flex items-center gap-2 text-[14px] font-semibold text-[#18181a]">
            設定・サポート
            {needsPayoutSetup ? (
              <span className="rounded-full bg-[#fde9ef] px-2 py-0.5 text-[10.5px] font-bold text-[#b84060]">
                要設定
              </span>
            ) : null}
          </span>
          <ChevronDown
            className={cn("h-4 w-4 text-[#c5c2ba] transition-transform", settingsOpen && "rotate-180")}
            aria-hidden
          />
        </button>
        {settingsOpen ? (
          <div className="border-t border-[#eceae3]">
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
              sub={`ログイン中：${displayEmail}`}
            />
            <SettingRow href="/contact" icon={<HelpCircle className="h-4 w-4" />} title="ヘルプ・お問い合わせ" />
          </div>
        ) : null}
      </section>

      <div className="flex justify-center pt-1">
        <OrganizerLogoutButton />
      </div>
    </div>
  );
}
