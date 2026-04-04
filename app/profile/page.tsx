"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { useSearchParams, useRouter } from "next/navigation";
import { SupabaseSetupGuide } from "@/components/supabase-setup-guide";
import { ProfileMenuLink } from "@/components/profile/profile-menu-link";
import { MypageHeader } from "@/components/profile/mypage-header";
import { MypageQuickGrid } from "@/components/profile/mypage-quick-grid";
import type { ProfileMode } from "@/components/profile/mode-switcher";
import { ModeHeader } from "@/components/profile/mode-header";
import { ModeStats } from "@/components/profile/mode-stats";
import { ModeLists } from "@/components/profile/mode-lists";
import { getProfileCompletion } from "@/lib/profile-dashboard-data";
import { useModeDashboardData } from "@/hooks/use-mode-dashboard-data";
import { useUnreadCount } from "@/hooks/use-unread-count";
import { useUnreadBreakdown } from "@/hooks/use-unread-breakdown";

const VALID_MODES: ProfileMode[] = ["participant", "volunteer", "organizer"];

function isValidMode(m: string | null): m is ProfileMode {
  return m !== null && VALID_MODES.includes(m as ProfileMode);
}

function ProfileContent() {
  const { user, loading: authLoading } = useSupabaseUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlMode = searchParams?.get("mode");
  const [resolvedMode, setResolvedMode] = useState<ProfileMode | null>(null);
  const [profile, setProfile] = useState<{
    displayName: string;
    region?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
    completionPercent: number;
    defaultMode?: string | null;
    isOrganizerRegistered?: boolean;
  }>({
    displayName: "",
    completionPercent: 0,
  });
  const unreadCount = useUnreadCount(!!user);
  const activeMode = resolvedMode ?? "participant";
  const stat2Breakdown = useUnreadBreakdown(!!user && activeMode === "organizer");
  const [loading, setLoading] = useState(true);
  const [noSupabase, setNoSupabase] = useState(false);

  const { data: dashboardData, loading: dataLoading } = useModeDashboardData(
    activeMode,
    user?.id ?? null,
    unreadCount
  );

  const persistDefaultMode = useCallback(
    async (mode: ProfileMode) => {
      if (!user) return;
      const supabase = createClient();
      if (!supabase) return;
      await supabase
        .from("profiles")
        .update({ default_mode: mode, updated_at: new Date().toISOString() })
        .eq("id", user.id);
    },
    [user]
  );

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setNoSupabase(true);
      setLoading(false);
      return;
    }
    (async () => {
      try {
        let authUser = (await supabase.auth.getUser()).data.user ?? null;
        if (!authUser && user) {
          authUser = user;
        }
        if (!authUser) {
          setResolvedMode(isValidMode(urlMode) ? urlMode : "participant");
          setLoading(false);
          return;
        }

        const displayName =
          (authUser.user_metadata?.display_name as string) ??
          (authUser.user_metadata?.name as string) ??
          authUser.email?.split("@")[0] ??
          "";
        let region: string | null = null;
        let avatarUrl: string | null = null;
        let defaultMode: string | null = "participant";

        const [{ data }, { data: organizerRow }] = await Promise.all([
          supabase
            .from("profiles")
            .select("display_name, avatar_url, phone, address, region, bio, default_mode")
            .eq("id", authUser.id)
            .single(),
          supabase
            .from("organizers")
            .select("id")
            .eq("profile_id", authUser.id)
            .maybeSingle(),
        ]);

        if (data) {
          const dn = (data.display_name ?? displayName) as string;
          defaultMode = (data.default_mode as string) ?? "participant";
          setProfile({
            displayName: dn,
            region: data.region,
            avatarUrl: data.avatar_url,
            bio: data.bio,
            completionPercent: getProfileCompletion({
              display_name: dn,
              region: data.region,
              phone: data.phone,
              bio: data.bio,
              avatar_url: data.avatar_url,
            }),
            defaultMode,
            isOrganizerRegistered: !!organizerRow,
          });
        } else {
          setProfile({
            displayName: displayName || "ゲスト",
            region: null,
            avatarUrl: null,
            bio: null,
            completionPercent: getProfileCompletion({
              display_name: displayName,
              region: null,
              phone: null,
              bio: null,
              avatar_url: null,
            }),
            defaultMode: "participant",
            isOrganizerRegistered: !!organizerRow,
          });
        }

        if (isValidMode(urlMode)) {
          setResolvedMode(urlMode);
        } else {
          const localMode = typeof window !== "undefined" ? localStorage.getItem("mg.profile.mode") : null;
          const fallback = (isValidMode(localMode) ? localMode : isValidMode(defaultMode) ? defaultMode : "participant") as ProfileMode;
          setResolvedMode(fallback);
          window.history.replaceState(null, "", `/profile?mode=${fallback}`);
        }
      } catch {
        setResolvedMode(isValidMode(urlMode) ? urlMode : "participant");
        setProfile((p) => ({ ...p, displayName: "ゲスト", completionPercent: 0 }));
      } finally {
        setLoading(false);
      }
    })();
  }, [urlMode, user?.id]);

  const handleModeChange = useCallback(
    (mode: ProfileMode) => {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      next.set("mode", mode);
      router.replace(`/profile?${next.toString()}`, { scroll: false });
      if (typeof window !== "undefined") {
        localStorage.setItem("mg.profile.mode", mode);
      }
      setResolvedMode(mode);
      persistDefaultMode(mode);
    },
    [persistDefaultMode, router, searchParams]
  );

  if (authLoading || loading || resolvedMode === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto min-h-screen max-w-3xl bg-zinc-50 px-4 py-6 pb-24 dark:bg-zinc-950 sm:pb-8 md:pb-8">
      {/* やわらかい背景 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-multiply dark:mix-blend-overlay dark:opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, var(--accent) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, var(--accent-soft) 0%, transparent 40%)`,
        }}
        aria-hidden
      />

      <div className="relative space-y-6">
        {/* トップへのリンク（控えめ） */}
        <div className="flex justify-end">
          <Link
            href="/"
            className="text-sm text-zinc-500 underline-offset-2 hover:text-zinc-700 hover:underline dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            トップへ
          </Link>
        </div>

        {noSupabase && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            <p className="font-medium">プロフィールの保存には Supabase の設定が必要です。</p>
            <p className="mt-1 text-xs opacity-90">環境変数を設定すると保存できます。</p>
            <div className="mt-3">
              <SupabaseSetupGuide backHref="/" backLabel="← トップへ" />
            </div>
          </div>
        )}

        {!user && !noSupabase && (
          <div className="rounded-2xl border border-zinc-200/80 bg-white px-5 py-6 text-center shadow-sm dark:border-zinc-700/60 dark:bg-zinc-900/95">
            <p className="text-zinc-700 dark:text-zinc-300">ログインするとプロフィールや参加予定を確認できます。</p>
            <Link
              href="/auth?next=/profile"
              className="mt-3 inline-block rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 active:opacity-95"
            >
              ログインはこちら
            </Link>
          </div>
        )}

        {user && (
          <>
            {/* 上部プロフィールエリア：マイページ型ヘッダー */}
            <MypageHeader
              displayName={profile.displayName}
              avatarUrl={profile.avatarUrl}
              bio={profile.bio}
              region={profile.region}
              activeMode={activeMode}
              onModeChange={handleModeChange}
              userId={user.id}
              onAvatarChange={(url) => setProfile((p) => ({ ...p, avatarUrl: url ?? null }))}
            />

            {/* よく使う：2列グリッドカード */}
            <MypageQuickGrid unreadCount={unreadCount} />

            {/* 設定セクション：リストUI */}
            <section>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                設定
              </h2>
              <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-700/60 dark:bg-zinc-900/95">
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  <ProfileMenuLink
                    href="/profile/edit"
                    icon="profile"
                    title="プロフィール設定"
                    subtitle="自己紹介・アイコン・基本情報"
                  />
                  <ProfileMenuLink
                    href="/profile/settings"
                    icon="notifications"
                    title="通知設定"
                    subtitle="メッセージ / イベント更新の通知"
                  />
                </div>
              </div>
            </section>

            {/* 主催セクション：行動導線 */}
            <section className={!profile.isOrganizerRegistered ? "mb-4" : ""}>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {profile.isOrganizerRegistered ? "主催" : "イベントを開きたい方"}
              </h2>
              {profile.isOrganizerRegistered ? (
                <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-700/60 dark:bg-zinc-900/95">
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    <ProfileMenuLink
                      href="/organizer/events"
                      icon="organizer"
                      title="主催ダッシュボード"
                      subtitle="作成中のイベント・募集・応募状況を確認"
                    />
                    <ProfileMenuLink
                      href="/organizer/events/new"
                      icon="event"
                      title="イベントを作成"
                      subtitle="新規イベントを登録する"
                    />
                    <ProfileMenuLink
                      href="/organizer/recruitments/new"
                      icon="recruitment"
                      title="募集を作成"
                      subtitle="ボランティアやスタッフを募集する"
                    />
                  </div>
                </div>
              ) : (
                <Link
                  href="/organizer/register"
                  className="group block rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-[box-shadow,border-color,background-color] hover:border-zinc-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:bg-zinc-50/50 active:border-zinc-300 active:bg-zinc-100/80 dark:border-zinc-600 dark:bg-zinc-900/95 dark:shadow-[0_2px_12px_rgba(0,0,0,0.15)] dark:hover:border-zinc-500 dark:hover:bg-zinc-800/80 dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] dark:active:bg-zinc-800"
                  style={{ borderLeftWidth: 4, borderLeftColor: "var(--accent)" }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                        個人でもOK
                      </span>
                      <h3 className="mt-2 font-semibold text-zinc-900 dark:text-zinc-100">
                        主催登録をはじめる
                      </h3>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        個人でも団体でも、イベント作成や募集管理を始められます。
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] group-hover:underline">
                        登録に進む
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              )}
            </section>

            {/* モード別ダッシュボード（参加予定・応募状況など） */}
            <section className="space-y-4 pt-2">
              <ModeHeader mode={activeMode} unreadCount={unreadCount} />
              <ModeStats
                mode={activeMode}
                stat1={dashboardData.stat1}
                stat2={dashboardData.stat2}
                stat3={dashboardData.stat3}
                stat2Breakdown={activeMode === "organizer" ? stat2Breakdown : undefined}
              />
              {dataLoading ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="h-48 animate-pulse rounded-2xl bg-zinc-200/80 dark:bg-zinc-700/50" />
                  <div className="h-48 animate-pulse rounded-2xl bg-zinc-200/80 dark:bg-zinc-700/50" />
                </div>
              ) : (
                <ModeLists
                  mode={activeMode}
                  list1={dashboardData.list1}
                  list2={dashboardData.list2}
                />
              )}
            </section>
          </>
        )}

        {!user && !noSupabase && (
          <div className="rounded-2xl border border-zinc-200/80 bg-white px-5 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700/60 dark:bg-zinc-900/95 dark:text-zinc-400">
            ログインするとメニューが表示されます
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-sm text-zinc-500">読み込み中...</p></div>}>
      <ProfileContent />
    </Suspense>
  );
}
