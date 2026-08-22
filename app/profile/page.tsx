"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  LogOut,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { useRouter } from "next/navigation";
import { SupabaseSetupGuide } from "@/components/supabase-setup-guide";
import { useUnreadCount } from "@/hooks/use-unread-count";
import { ProfilePageSkeleton } from "@/components/profile/ProfilePageSkeleton";
import { MypageMobileProfileCard } from "@/components/profile/mypage-mobile-profile-card";
import { MypageMobileOrganize } from "@/components/profile/mypage-mobile-organize";
import { MypageMobileAlbum } from "@/components/profile/mypage-mobile-album";
import { MypageMobileFooterLinks } from "@/components/profile/mypage-mobile-footer-links";
import { MypagePcView } from "@/components/profile/mypage-pc-view";
import {
  prefetchMypageSummary,
  resetMypageSummaryPrefetch,
  type MypageSummaryResponse,
} from "@/lib/prefetch-mypage-summary";

const MG_GREEN = "#2F8F57";
const MG_GREEN_SOFT = "#EAF6EF";
const CARD_SHADOW = "0 2px 12px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.04)";

function fallbackDisplayName(user: {
  user_metadata?: Record<string, unknown>;
  email?: string | null;
}): string {
  return (
    (user.user_metadata?.display_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split("@")[0] ??
    "ゲスト"
  );
}

function emptySummary(displayName: string): MypageSummaryResponse {
  return {
    profile: {
      displayName,
      avatarUrl: null,
      bio: null,
      region: null,
      isOrganizerRegistered: false,
    },
    stats: { participated: 0, posts: 0, volunteer: 0, favorites: 0, followers: 0, following: 0 },
    counts: {
      planned: 0,
      interested: 0,
      passes: 0,
      volunteerApplications: 0,
    },
    nextEvent: null,
    nextVolunteer: null,
    posts: [],
    activity: [],
  };
}


function MobileRow({
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
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[48px] items-center gap-3 border-b border-[#eceae3] px-4 py-2.5 transition-colors last:border-b-0 hover:bg-[#fafaf8]"
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: MG_GREEN_SOFT, color: MG_GREEN }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium text-[#18181a]">{title}</div>
        {sub && <div className="mt-0.5 truncate text-[11px] text-[#8c8a84]">{sub}</div>}
      </div>
      {badge !== undefined && badge > 0 && (
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
          style={{ backgroundColor: MG_GREEN_SOFT, color: MG_GREEN }}
        >
          {badge}
        </span>
      )}
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#c5c2ba]" aria-hidden />
    </Link>
  );
}

function ProfileContent() {
  const { user, loading: authLoading } = useSupabaseUser();
  const router = useRouter();
  const [summary, setSummary] = useState<MypageSummaryResponse | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [noSupabase] = useState(() => createClient() === null);
  const unreadCount = useUnreadCount(!!user);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    prefetchMypageSummary()
      .then((data) => {
        if (cancelled) return;
        setSummary(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleLogout = async () => {
    resetMypageSummaryPrefetch();
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    router.push("/");
  };

  if (authLoading) return <ProfilePageSkeleton />;

  const displayName =
    summary?.profile.displayName ||
    (user ? fallbackDisplayName(user) : "ゲスト");
  const data = summary ?? emptySummary(displayName);

  return (
    <div className="mg-profile-mobile-page mg-mypage-mobile-white max-[899px]:overflow-x-hidden min-[900px]:flex min-[900px]:min-h-0 min-[900px]:flex-1 min-[900px]:flex-col min-[900px]:bg-[#F7F8F5]">
      {noSupabase && (
        <div className="px-4 pt-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            <p className="font-medium">プロフィールの保存には Supabase の設定が必要です。</p>
            <div className="mt-3">
              <SupabaseSetupGuide backHref="/" backLabel="← トップへ" />
            </div>
          </div>
        </div>
      )}

      {!user && !noSupabase && (
        <div className="flex min-h-screen items-center justify-center px-4">
          <div
            className="w-full max-w-sm rounded-2xl border border-[#DEDAD2] bg-white px-6 py-8 text-center"
            style={{ boxShadow: "0 4px 16px rgba(0,0,0,.08)" }}
          >
            <p className="text-[#52504c]">ログインするとプロフィールや参加予定を確認できます。</p>
            <Link
              href="/auth?next=/profile"
              className="mt-4 inline-block rounded-xl bg-[#2F8F57] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              ログインはこちら
            </Link>
          </div>
        </div>
      )}

      {user && (
        <>
          <div className="mx-auto flex w-full max-w-screen-sm flex-col gap-2.5 px-4 pt-1.5 pb-4 min-[900px]:hidden">
            <MypageMobileProfileCard
              displayName={displayName}
              avatarUrl={data.profile.avatarUrl}
              bio={data.profile.bio}
              region={data.profile.region}
              isOrganizerRegistered={data.profile.isOrganizerRegistered}
              onLogout={handleLogout}
              showLogout={false}
              social={{
                album: data.stats.posts,
                followers: data.stats.followers,
                following: data.stats.following,
              }}
            />

            <MypageMobileOrganize
              isOrganizerRegistered={data.profile.isOrganizerRegistered}
            />

            <MypageMobileAlbum />

            <section
              className="overflow-hidden rounded-[14px] border border-[#e8e6e0] bg-white"
              style={{ boxShadow: CARD_SHADOW }}
            >
              <button
                type="button"
                onClick={() => setSettingsOpen((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
                aria-expanded={settingsOpen}
              >
                <span className="text-[13px] font-semibold text-[#18181a]">設定・サポート</span>
                <ChevronDown
                  className={`h-4 w-4 text-[#c5c2ba] transition-transform ${
                    settingsOpen ? "rotate-180" : ""
                  }`}
                  aria-hidden
                />
              </button>
              {settingsOpen && (
                <>
                  <MobileRow
                    href="/profile/edit"
                    icon={<UserRound className="h-4 w-4" />}
                    title="プロフィール設定"
                  />
                  <MobileRow
                    href="/profile/privacy"
                    icon={<UserRound className="h-4 w-4" />}
                    title="公開 / 非公開"
                  />
                  <MobileRow
                    href="/profile/settings"
                    icon={<Bell className="h-4 w-4" />}
                    title="通知設定"
                  />
                  <MobileRow
                    href="/contact"
                    icon={<HelpCircle className="h-4 w-4" />}
                    title="ヘルプ・お問い合わせ"
                  />
                </>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full cursor-pointer items-center justify-center gap-1.5 border-t border-[#eceae3] px-4 py-3 text-[13px] font-semibold"
                style={{ color: "#C53030", backgroundColor: "#FFF5F5" }}
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden />
                ログアウト
              </button>
            </section>

            <MypageMobileFooterLinks />
          </div>

          <MypagePcView
            displayName={displayName}
            avatarUrl={data.profile.avatarUrl}
            bio={data.profile.bio}
            region={data.profile.region}
            counts={data.counts}
            nextEvent={data.nextEvent}
            nextVolunteer={data.nextVolunteer}
            activity={data.activity}
            unreadCount={unreadCount}
            isOrganizerRegistered={data.profile.isOrganizerRegistered}
            social={{
              album: data.stats.posts,
              followers: data.stats.followers,
              following: data.stats.following,
            }}
            onLogout={handleLogout}
          />
        </>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfilePageSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}
