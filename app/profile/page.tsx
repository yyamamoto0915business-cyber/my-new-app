"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { SupabaseSetupGuide } from "@/components/supabase-setup-guide";
import { ProfileSummaryCard } from "@/components/profile/profile-summary-card";
import { ProfileRoleTabs, type ProfileRoleTab } from "@/components/profile/profile-role-tabs";
import { ParticipantTab } from "@/components/profile/tabs/participant-tab";
import { VolunteerTab } from "@/components/profile/tabs/volunteer-tab";
import { OrganizerTab } from "@/components/profile/tabs/organizer-tab";
import { getProfileCompletion } from "@/lib/profile-dashboard-data";
import { GlyphSectionTitle } from "@/components/glyph/glyph-section-title";

export default function ProfilePage() {
  const { user, loading: authLoading } = useSupabaseUser();
  const [activeTab, setActiveTab] = useState<ProfileRoleTab>("participant");
  const [profile, setProfile] = useState<{
    displayName: string;
    region?: string | null;
    avatarUrl?: string | null;
    completionPercent: number;
  }>({
    displayName: "",
    completionPercent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [noSupabase, setNoSupabase] = useState(false);

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

        const { data } = await supabase
          .from("profiles")
          .select("display_name, avatar_url, phone, address, region, bio")
          .eq("id", authUser.id)
          .single();

        if (data) {
          const dn = data.display_name ?? displayName;
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
          });
        }
      } catch {
        setProfile((p) => ({ ...p, displayName: "ゲスト", completionPercent: 0 }));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-lg px-4 py-6 pb-24 sm:pb-8 md:pb-8 min-h-screen bg-[var(--mg-paper)]">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-multiply dark:mix-blend-overlay dark:opacity-[0.04]"
        style={{
          backgroundImage: `repeating-conic-gradient(var(--mg-ink) 0% 0.25%, transparent 0% 0.5%)`,
          backgroundSize: "2px 2px",
        }}
        aria-hidden
      />
      <div className="mb-6 flex items-center justify-between">
        <GlyphSectionTitle as="h1">
          マイページ
        </GlyphSectionTitle>
        <Link
          href="/"
          className="text-sm text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          トップへ
        </Link>
      </div>

      {noSupabase && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          <p className="font-medium">プロフィールの保存には Supabase の設定が必要です。</p>
          <p className="mt-1 text-xs opacity-90">
            環境変数を設定すると保存できます。
          </p>
          <div className="mt-3">
            <SupabaseSetupGuide backHref="/" backLabel="← トップへ" />
          </div>
        </div>
      )}

      {!user && !noSupabase && (
        <div className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--accent-soft)]/30 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
          <p>ログインするとプロフィールや参加予定を確認できます。</p>
          <Link
            href="/login?returnTo=/profile"
            className="mt-2 inline-block font-medium text-[var(--accent)] hover:underline"
          >
            ログインはこちら
          </Link>
        </div>
      )}

      {user && (
        <>
          {/* プロフィール概要カード */}
          <section className="mb-6">
            <ProfileSummaryCard profile={profile} />
          </section>

          {/* ロール切替タブ */}
          <section className="mb-6">
            <ProfileRoleTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </section>

          {/* タブ内容 */}
          <section>
            {activeTab === "participant" && <ParticipantTab userId={user.id} />}
            {activeTab === "volunteer" && <VolunteerTab userId={user.id} />}
            {activeTab === "organizer" && <OrganizerTab userId={user.id} />}
          </section>
        </>
      )}

      {!user && !noSupabase && (
        <div className="space-y-6 text-center">
          <ProfileRoleTabs activeTab={activeTab} onTabChange={setActiveTab} />
          {activeTab === "participant" && <ParticipantTab userId={null} />}
          {activeTab === "volunteer" && <VolunteerTab userId={null} />}
          {activeTab === "organizer" && <OrganizerTab userId={null} />}
        </div>
      )}

      {/* その他リンク */}
      <div className="mt-8 border-t pt-6 [border-color:var(--mg-line)]">
        <ul className="space-y-2 text-sm">
          <li>
            <Link
              href="/messages"
              className="text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
            >
              メッセージ
            </Link>
          </li>
          <li>
            <Link
              href="/points"
              className="text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
            >
              マイポイント
            </Link>
          </li>
          <li>
            <Link
              href="/organizer/register"
              className="text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
            >
              主催者として登録する
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
