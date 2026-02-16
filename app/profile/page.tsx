"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SupabaseSetupGuide } from "@/components/supabase-setup-guide";

export default function ProfilePage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace(`/login?returnTo=${encodeURIComponent("/profile")}`);
          return;
        }
        setEmail(user.email ?? null);
        setDisplayName((user.user_metadata?.display_name as string) ?? "");
        const { data } = await supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("id", user.id)
          .single();
        if (data) {
          setDisplayName(data.display_name ?? "");
          setAvatarUrl(data.avatar_url ?? "");
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);
    const supabase = createClient();
    if (!supabase) {
      setError("Supabase が設定されていません");
      setSaving(false);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login?returnTo=/profile");
      setSaving(false);
      return;
    }
    const { error: updateError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email ?? null,
          display_name: displayName || null,
          avatar_url: avatarUrl || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await supabase.auth.updateUser({
      data: { display_name: displayName || undefined },
    });
    setSuccess(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  if (noSupabase) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <SupabaseSetupGuide backHref="/" backLabel="← トップへ" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        ← トップへ
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        マイページ
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        あなたの情報を登録・更新できます
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            メールアドレス
          </label>
          <input
            type="email"
            value={email ?? ""}
            disabled
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2 text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
          />
          <p className="mt-1 text-xs text-zinc-500">
            メールアドレスはログインに使用するため変更できません
          </p>
        </div>

        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            表示名
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="例: 山田 太郎"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <p className="mt-1 text-xs text-zinc-500">
            チャットや参加者一覧などで表示されます
          </p>
        </div>

        <div>
          <label htmlFor="avatarUrl" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            アバター画像URL（任意）
          </label>
          <input
            id="avatarUrl"
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-600 dark:text-green-400">
            保存しました
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存する"}
        </button>
      </form>

      <div className="mt-8 border-t border-zinc-200 pt-6 dark:border-zinc-700">
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          その他
        </h2>
        <ul className="mt-2 space-y-2 text-sm">
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
