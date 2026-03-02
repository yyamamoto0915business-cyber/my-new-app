"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { useSearchParams } from "next/navigation";
import { SupabaseSetupGuide } from "@/components/supabase-setup-guide";
import { ProfileSummaryCard } from "@/components/profile/profile-summary-card";
import { ProfileMenuLink } from "@/components/profile/profile-menu-link";
import { ModeSwitcher, type ProfileMode } from "@/components/profile/mode-switcher";
import { ModeHeader } from "@/components/profile/mode-header";
import { ModeStats } from "@/components/profile/mode-stats";
import { ModeLists } from "@/components/profile/mode-lists";
import { getProfileCompletion } from "@/lib/profile-dashboard-data";
import { useModeDashboardData } from "@/hooks/use-mode-dashboard-data";
import { useUnreadCount } from "@/hooks/use-unread-count";
import { useUnreadBreakdown } from "@/hooks/use-unread-breakdown";
import { GlyphSectionTitle } from "@/components/glyph/glyph-section-title";

const VALID_MODES: ProfileMode[] = ["participant", "volunteer", "organizer"];

function isValidMode(m: string | null): m is ProfileMode {
  return m !== null && VALID_MODES.includes(m as ProfileMode);
}

function ProfileContent() {
  const { user, loading: authLoading } = useSupabaseUser();
  const searchParams = useSearchParams();
  const urlMode = searchParams?.get("mode");
  const [resolvedMode, setResolvedMode] = useState<ProfileMode | null>(null);
  const [profile, setProfile] = useState<{
    displayName: string;
    region?: string | null;
    avatarUrl?: string | null;
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
        const { data: { user: authUser } } = await supabase.auth.getUser();
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
  }, [urlMode]);

  const handleModeChange = useCallback(
    (mode: ProfileMode) => {
      persistDefaultMode(mode);
    },
    [persistDefaultMode]
  );

  if (authLoading || loading || resolvedMode === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-6 pb-24 sm:pb-8 md:pb-8 min-h-screen bg-[var(--mg-paper)]">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-multiply dark:mix-blend-overlay dark:opacity-[0.04]"
        style={{
          backgroundImage: `repeating-conic-gradient(var(--mg-ink) 0% 0.25%, transparent 0% 0.5%)`,
          backgroundSize: "2px 2px",
        }}
        aria-hidden
      />

      <div className="relative mb-6 flex items-center justify-between">
        <GlyphSectionTitle as="h1">マイページ</GlyphSectionTitle>
        <Link
          href="/"
          className="text-sm text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          トップへ
        </Link>
      </div>

      {noSupabase && (
        <div className="relative mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          <p className="font-medium">プロフィールの保存には Supabase の設定が必要です。</p>
          <p className="mt-1 text-xs opacity-90">環境変数を設定すると保存できます。</p>
          <div className="mt-3">
            <SupabaseSetupGuide backHref="/" backLabel="← トップへ" />
          </div>
        </div>
      )}

      {!user && !noSupabase && (
        <div className="relative mb-6 rounded-lg border border-[var(--border)] bg-[var(--accent-soft)]/30 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
          <p>ログインするとプロフィールや参加予定を確認できます。</p>
          <Link
            href="/login?returnTo=/profile"
            className="mt-2 inline-block font-medium text-[var(--accent)] hover:underline"
          >
            ログインはこちら
          </Link>
        </div>
      )}

      {/* プロフィールカード（一番上） */}
      {user && (
        <div className="relative mb-6">
          <ProfileSummaryCard
            profile={profile}
            unreadCount={unreadCount}
            userId={user.id}
            onAvatarChange={(newUrl) =>
              setProfile((p) => ({ ...p, avatarUrl: newUrl ?? null }))
            }
          />
        </div>
      )}

      {/* (1) モード切替タブ */}
      <section className="relative mb-6">
        <ModeSwitcher activeMode={activeMode} onModeChange={handleModeChange} />
      </section>

      {user && (
        <>
          {/* (2) ヘッダー */}
          <section className="relative mb-4">
            <ModeHeader mode={activeMode} unreadCount={unreadCount} />
          </section>

          {/* (3) ステータスカード */}
          <section className="relative mb-6">
            <ModeStats
              mode={activeMode}
              stat1={dashboardData.stat1}
              stat2={dashboardData.stat2}
              stat3={dashboardData.stat3}
              stat2Breakdown={activeMode === "organizer" ? stat2Breakdown : undefined}
            />
          </section>

          {/* (4) 2カラム一覧 */}
          <section className="relative">
            {dataLoading ? (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="h-48 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
                <div className="h-48 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
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
        <div className="relative space-y-6">
          <ModeHeader mode={activeMode} unreadCount={0} />
          <ModeStats mode={activeMode} stat1={0} stat2={0} stat3={0} />
          <ModeLists mode={activeMode} list1={[]} list2={[]} />
        </div>
      )}

      {/* (5) 共通：メニュー */}
      <div className="relative mt-8 border-t pt-6 [border-color:var(--mg-line)]">
        {/* メニューセクション */}
        <div className="rounded-xl border border-[var(--mg-line)] bg-white dark:border-zinc-700 dark:bg-zinc-900/90">
          <div className="border-b border-[var(--mg-line)] px-4 py-3 dark:border-zinc-700">
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100">メニュー</h3>
            <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">設定やメッセージはこちら</p>
          </div>
          {user ? (
            <div className="divide-y divide-[var(--mg-line)] dark:divide-zinc-700">
              {/* セクションA: やり取り・活動 */}
              <div className="py-1">
                <ProfileMenuLink
                  href="/messages"
                  icon="messages"
                  title="メッセージ"
                  subtitle="主催者との連絡 / 応募・参加のやり取り"
                  badge={unreadCount > 0 ? unreadCount : undefined}
                />
                <ProfileMenuLink
                  href="/points"
                  icon="points"
                  title="マイポイント"
                  subtitle="保有ポイント・履歴を確認"
                />
              </div>
              {/* セクションB: アカウント・設定 */}
              <div className="py-1">
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
              {/* セクションC: 主催者 */}
              {profile.isOrganizerRegistered ? (
                <div className="py-1">
                  <ProfileMenuLink
                    href="/organizer/events"
                    icon="organizer"
                    title="主催者ダッシュボード"
                    subtitle="イベント管理・応募者対応へ"
                  />
                </div>
              ) : (
                <div className="py-1">
                  <ProfileMenuLink
                    href="/organizer/register"
                    icon="organizer"
                    title="主催者として始める"
                    subtitle="イベントを作成して募集を出す"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-sm text-[var(--foreground-muted)]">
              ログインするとメニューが表示されます
            </div>
          )}
        </div>
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
