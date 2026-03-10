"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Building2,
  CreditCard,
  Bell,
  Shield,
  ChevronRight,
  Layout,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { SettingsSectionCard } from "@/components/organizer/settings/SettingsSectionCard";

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
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const displayEmail = user?.email ?? "—";
  const displayName =
    (user?.user_metadata?.display_name as string) ??
    (user?.user_metadata?.name as string) ??
    user?.email?.split("@")[0] ??
    "—";

  return (
    <div className="min-h-screen bg-[var(--mg-paper)]">
      <div className="mx-auto max-w-2xl">
        {/* 上部見出し */}
        <header className="mb-6 sm:mb-8">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">設定</h1>
          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            主催者情報や表示内容、通知設定を管理できます
          </p>
        </header>

        <div className="space-y-6 sm:space-y-8">
          {/* アカウント情報セクション */}
          <section
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5"
            aria-labelledby="account-heading"
          >
            <h2
              id="account-heading"
              className="flex items-center gap-2 text-base font-semibold text-slate-900"
            >
              <User className="h-4 w-4 text-slate-600" />
              アカウント情報
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              ログイン中のアカウントや表示名を管理します
            </p>
            <dl className="mt-4 space-y-3">
              <div>
                <dt className="text-xs font-medium text-slate-500">ログイン中</dt>
                <dd className="mt-0.5 text-sm font-medium text-slate-900">{displayEmail}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">表示名</dt>
                <dd className="mt-0.5 text-sm text-slate-900">{displayName || "未設定"}</dd>
              </div>
            </dl>
            <Link
              href="/profile/edit"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              プロフィールを編集
              <ChevronRight className="h-4 w-4" />
            </Link>
          </section>

          {/* 主催者プロフィールセクション */}
          <section
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5"
            aria-labelledby="organizer-heading"
          >
            <h2
              id="organizer-heading"
              className="flex items-center gap-2 text-base font-semibold text-slate-900"
            >
              <Building2 className="h-4 w-4 text-slate-600" />
              主催者プロフィール
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              イベント参加者に表示される主催者・団体情報です
            </p>
            {loading ? (
              <p className="mt-4 text-sm text-slate-500">読み込み中...</p>
            ) : (
              <>
                <dl className="mt-4 space-y-3">
                  <div>
                    <dt className="text-xs font-medium text-slate-500">団体名 / 主催者名</dt>
                    <dd className="mt-0.5 text-sm text-slate-900">
                      {organizer?.organization_name || "未設定"}
                    </dd>
                  </div>
                  {(organizer?.contact_email || organizer?.contact_phone) && (
                    <div>
                      <dt className="text-xs font-medium text-slate-500">問い合わせ先</dt>
                      <dd className="mt-0.5 text-sm text-slate-900">
                        {[organizer.contact_email, organizer.contact_phone]
                          .filter(Boolean)
                          .join(" / ") || "—"}
                      </dd>
                    </div>
                  )}
                </dl>
                <Link
                  href="/organizer/settings/profile"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  主催者プロフィールを編集
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </section>

          {/* プラン・決済設定 */}
          <section aria-labelledby="billing-heading">
            <SettingsSectionCard
              title="プラン・決済設定"
              description="主催者プランの確認、アップグレード、売上の受取設定ができます"
              href="/organizer/settings/billing"
              icon={CreditCard}
            />
          </section>

          {/* 公開情報・表示設定（将来用のプレースホルダー） */}
          <section
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5"
            aria-labelledby="display-heading"
          >
            <h2
              id="display-heading"
              className="flex items-center gap-2 text-base font-semibold text-slate-900"
            >
              <Layout className="h-4 w-4 text-slate-600" />
              公開情報 / 表示設定
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              主催者ページやイベントでの表示設定（準備中）
            </p>
          </section>

          {/* 通知設定 */}
          <SettingsSectionCard
            title="通知設定"
            description="お知らせの受け取り方を設定できます"
            href="/profile/settings"
            icon={Bell}
            badge="準備中"
          />

          {/* セキュリティ / ログアウト */}
          <section
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5"
            aria-labelledby="security-heading"
          >
            <h2
              id="security-heading"
              className="flex items-center gap-2 text-base font-semibold text-slate-900"
            >
              <Shield className="h-4 w-4 text-slate-600" />
              セキュリティ / ログアウト
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              ログアウトは右上のアカウントメニューから行えます。プロフィールやパスワードの変更はアカウント設定で行えます。
            </p>
            <Link
              href="/profile/edit"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              アカウント設定を開く
              <ChevronRight className="h-4 w-4" />
            </Link>
          </section>
        </div>

        <div className="mt-8 pb-12">
          <Link
            href="/organizer"
            className="text-sm text-slate-500 hover:text-slate-700 hover:underline"
          >
            ← ダッシュボードへ戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
