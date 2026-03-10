"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/use-supabase-user";

export default function OrganizerProfileSettingsPage() {
  const { user } = useSupabaseUser();
  const [organizationName, setOrganizationName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
        if (!cancelled && data) {
          setOrganizationName((data.organization_name as string) ?? "");
          setContactEmail((data.contact_email as string) ?? "");
          setContactPhone((data.contact_phone as string) ?? "");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const supabase = createClient();
    if (!supabase || !user?.id) {
      setError("ログインが必要です");
      return;
    }
    setSaving(true);
    try {
      const orgName = organizationName.trim();
      if (!orgName) {
        setError("団体名・主催者名は必須です");
        setSaving(false);
        return;
      }

      const { error: updateError } = await supabase
        .from("organizers")
        .update({
          organization_name: orgName,
          contact_email: contactEmail.trim() || null,
          contact_phone: contactPhone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("profile_id", user.id);

      if (updateError) throw updateError;
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-sm text-slate-500">読み込み中...</p>
      </div>
    );
  }

  const inputBase =
    "mt-1.5 w-full rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200/50 disabled:bg-slate-50 disabled:text-slate-500";

  return (
    <div className="min-h-screen bg-[var(--mg-paper)]">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/organizer/settings"
          className="mb-4 inline-block text-sm text-slate-500 hover:text-slate-700 hover:underline"
        >
          ← 設定へ戻る
        </Link>

        <header className="mb-6 sm:mb-8">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            主催者プロフィール
          </h1>
          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            イベント参加者に表示される主催者・団体情報を編集します
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-semibold text-slate-900">公開情報</h2>
            <p className="mt-1 text-sm text-slate-500">
              イベント詳細や募集ページで参加者に表示されます
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="organizationName"
                  className="block text-sm font-medium text-slate-700"
                >
                  団体名 / 主催者名 <span className="text-amber-600">必須</span>
                </label>
                <input
                  id="organizationName"
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="例：地域振興会 / 山田太郎"
                  className={inputBase}
                  required
                  aria-required
                />
              </div>
              <div>
                <label
                  htmlFor="contactEmail"
                  className="block text-sm font-medium text-slate-700"
                >
                  問い合わせメール（任意）
                </label>
                <input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="例：contact@example.com"
                  className={inputBase}
                />
                <p className="mt-1 text-xs text-slate-500">
                  参加者から連絡を受け付けるメールアドレス
                </p>
              </div>
              <div>
                <label
                  htmlFor="contactPhone"
                  className="block text-sm font-medium text-slate-700"
                >
                  問い合わせ電話番号（任意）
                </label>
                <input
                  id="contactPhone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="例：090-1234-5678"
                  className={inputBase}
                />
              </div>
            </div>
          </section>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-emerald-600" role="status">
              保存しました
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] w-full rounded-xl bg-[var(--mg-accent,theme(colors.amber.600))] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
            >
              {saving ? "保存中..." : "保存する"}
            </button>
            <Link
              href="/organizer/settings"
              className="min-h-[44px] flex items-center justify-center rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto"
            >
              キャンセル
            </Link>
          </div>
        </form>

        <div className="mt-8 pb-12">
          <Link
            href="/organizer/settings"
            className="text-sm text-slate-500 hover:text-slate-700 hover:underline"
          >
            ← 設定へ戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
