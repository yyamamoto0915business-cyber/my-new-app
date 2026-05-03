"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User, Building2, Bell, Shield, ChevronRight, Layout } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { SettingsSectionCard } from "@/components/organizer/settings/SettingsSectionCard";
import { OrganizerSettingsPlanPayoutCards } from "@/components/organizer/settings/OrganizerSettingsPlanPayoutCards";
import { WaHeroBanner } from "@/components/wa-hero-banner";

export default function OrganizerSettingsPage() {
  const { user } = useSupabaseUser();
  const [organizer, setOrganizer] = useState<{
    organization_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase || !user?.id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("organizers")
          .select("organization_name, contact_email, contact_phone")
          .eq("profile_id", user.id)
          .maybeSingle();
        if (!cancelled) setOrganizer(data ?? null);
      } catch {
        if (!cancelled) setOrganizer(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const displayEmail = user?.email ?? "—";
  const displayName =
    (user?.user_metadata?.display_name as string) ??
    (user?.user_metadata?.name as string) ??
    user?.email?.split("@")[0] ??
    "—";

  return (
    <div className="min-h-screen bg-[#f4f0e8]">
      <div className="mx-auto max-w-2xl space-y-4">
        <WaHeroBanner
          compact
          eyebrow="SETTINGS"
          title="設定"
          subtitle="— アカウント・通知設定 —"
          className="rounded-sm"
        />

        {/* ナビ帯 */}
        <div className="flex items-center rounded-2xl border border-[#ccc4b4] bg-[#faf8f2] px-4 py-3">
          <Link href="/organizer" className="text-[12px] text-[#6a6258] hover:underline">
            ← ダッシュボードへ
          </Link>
        </div>

        {/* プラン・売上受取 */}
        <section aria-labelledby="plan-payout-heading" className="space-y-3">
          <h2 id="plan-payout-heading" className="sr-only">料金プランと売上受取</h2>
          <OrganizerSettingsPlanPayoutCards />
        </section>

        {/* セクション区切り */}
        <div className="flex items-center gap-2 px-1">
          <div className="h-px flex-1 bg-[#c0b8a8] opacity-60" />
          <span
            className="text-[10px] tracking-[0.18em] text-[#5a5448] whitespace-nowrap"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            アカウント情報
          </span>
          <div className="h-px flex-1 bg-[#c0b8a8] opacity-60" />
        </div>

        {/* アカウント情報 */}
        <section
          className="overflow-hidden rounded-2xl border border-[#ccc4b4]"
          aria-labelledby="account-heading"
        >
          <div className="border-b border-[#ccc4b4] bg-[#1e3020] px-4 py-2.5">
            <h2
              id="account-heading"
              className="flex items-center gap-2 text-[13px] font-bold text-[#f4f0e8]"
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            >
              <User className="h-3.5 w-3.5 text-[#a8c8a4]" />
              アカウント情報
            </h2>
          </div>
          <div className="bg-[#faf8f2] p-4">
            <p className="text-[12px] text-[#6a6258]">ログイン中のアカウントや表示名を管理します</p>
            <dl className="mt-3 space-y-2.5">
              <div>
                <dt className="text-[10px] font-medium tracking-wide text-[#6a6258]">ログイン中</dt>
                <dd className="mt-0.5 text-[13px] font-medium text-[#0e1610]">{displayEmail}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-medium tracking-wide text-[#6a6258]">表示名</dt>
                <dd className="mt-0.5 text-[13px] text-[#0e1610]">{displayName || "未設定"}</dd>
              </div>
            </dl>
            <Link
              href="/profile/edit"
              className="mt-3 inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[#ccc4b4] bg-white px-4 text-[12px] font-medium text-[#3a3428] transition hover:bg-[#f0ece4]"
            >
              プロフィールを編集
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        {/* 主催者プロフィール */}
        <section
          className="overflow-hidden rounded-2xl border border-[#ccc4b4]"
          aria-labelledby="organizer-heading"
        >
          <div className="border-b border-[#ccc4b4] bg-[#1e3020] px-4 py-2.5">
            <h2
              id="organizer-heading"
              className="flex items-center gap-2 text-[13px] font-bold text-[#f4f0e8]"
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            >
              <Building2 className="h-3.5 w-3.5 text-[#a8c8a4]" />
              主催者プロフィール
            </h2>
          </div>
          <div className="bg-[#faf8f2] p-4">
            <p className="text-[12px] text-[#6a6258]">イベント参加者に表示される主催者・団体情報です</p>
            {loading ? (
              <p className="mt-3 text-[13px] text-[#6a6258]">読み込み中...</p>
            ) : (
              <>
                <dl className="mt-3 space-y-2.5">
                  <div>
                    <dt className="text-[10px] font-medium tracking-wide text-[#6a6258]">団体名 / 主催者名</dt>
                    <dd className="mt-0.5 text-[13px] text-[#0e1610]">
                      {organizer?.organization_name || "未設定"}
                    </dd>
                  </div>
                  {(organizer?.contact_email || organizer?.contact_phone) && (
                    <div>
                      <dt className="text-[10px] font-medium tracking-wide text-[#6a6258]">問い合わせ先</dt>
                      <dd className="mt-0.5 text-[13px] text-[#0e1610]">
                        {[organizer.contact_email, organizer.contact_phone].filter(Boolean).join(" / ") || "—"}
                      </dd>
                    </div>
                  )}
                </dl>
                <Link
                  href="/organizer/settings/profile"
                  className="mt-3 inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[#ccc4b4] bg-white px-4 text-[12px] font-medium text-[#3a3428] transition hover:bg-[#f0ece4]"
                >
                  主催者プロフィールを編集
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </section>

        {/* セクション区切り */}
        <div className="flex items-center gap-2 px-1">
          <div className="h-px flex-1 bg-[#c0b8a8] opacity-60" />
          <span
            className="text-[10px] tracking-[0.18em] text-[#5a5448] whitespace-nowrap"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            その他の設定
          </span>
          <div className="h-px flex-1 bg-[#c0b8a8] opacity-60" />
        </div>

        {/* 公開情報・表示設定 */}
        <section
          className="overflow-hidden rounded-2xl border border-[#ccc4b4]"
          aria-labelledby="display-heading"
        >
          <div className="border-b border-[#ccc4b4] bg-[#1e3020] px-4 py-2.5">
            <h2
              id="display-heading"
              className="flex items-center gap-2 text-[13px] font-bold text-[#f4f0e8]"
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            >
              <Layout className="h-3.5 w-3.5 text-[#a8c8a4]" />
              公開情報 / 表示設定
            </h2>
          </div>
          <div className="bg-[#faf8f2] p-4">
            <p className="text-[12px] text-[#6a6258]">主催者ページやイベントでの表示設定（準備中）</p>
          </div>
        </section>

        {/* 通知設定 */}
        <SettingsSectionCard
          title="通知設定"
          description="お知らせの受け取り方を設定できます"
          href="/profile/settings"
          icon={Bell}
          badge="準備中"
        />

        {/* セキュリティ */}
        <section
          className="overflow-hidden rounded-2xl border border-[#ccc4b4]"
          aria-labelledby="security-heading"
        >
          <div className="border-b border-[#ccc4b4] bg-[#1e3020] px-4 py-2.5">
            <h2
              id="security-heading"
              className="flex items-center gap-2 text-[13px] font-bold text-[#f4f0e8]"
              style={{ fontFamily: "'Shippori Mincho', serif" }}
            >
              <Shield className="h-3.5 w-3.5 text-[#a8c8a4]" />
              セキュリティ / ログアウト
            </h2>
          </div>
          <div className="bg-[#faf8f2] p-4">
            <p className="text-[12px] text-[#6a6258]">
              ログアウトは右上のアカウントメニューから行えます。プロフィールやパスワードの変更はアカウント設定で行えます。
            </p>
            <Link
              href="/profile/edit"
              className="mt-3 inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[#ccc4b4] bg-white px-4 text-[12px] font-medium text-[#3a3428] transition hover:bg-[#f0ece4]"
            >
              アカウント設定を開く
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        <div className="pb-12" />
      </div>
    </div>
  );
}
