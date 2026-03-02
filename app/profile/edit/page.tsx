"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SupabaseSetupGuide } from "@/components/supabase-setup-guide";

export default function ProfileEditPage() {
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const avatarCameraInputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [region, setRegion] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [noSupabase, setNoSupabase] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
          setIsLoggedIn(false);
          setLoading(false);
          return;
        }
        setIsLoggedIn(true);
        setEmail(user.email ?? null);
        setDisplayName((user.user_metadata?.display_name as string) ?? "");
        const { data } = await supabase
          .from("profiles")
          .select("display_name, avatar_url, phone, address, region, bio")
          .eq("id", user.id)
          .single();
        if (data) {
          setDisplayName(data.display_name ?? "");
          setAvatarUrl(data.avatar_url ?? "");
          setPhone(data.phone ?? "");
          setAddress(data.address ?? "");
          setRegion(data.region ?? "");
          setBio(data.bio ?? "");
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    const supabase = createClient();
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(urlData.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "アップロードに失敗しました");
    } finally {
      setSaving(false);
    }
  };

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
      setError("プロフィールを保存するにはログインが必要です");
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
          phone: phone.trim() || null,
          address: address.trim() || null,
          region: region.trim() || null,
          bio: bio.trim() || null,
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

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <Link
        href="/profile"
        className="mb-6 inline-block text-sm text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        ← マイページへ
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        プロフィール編集
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        あなたの情報を登録・更新できます
      </p>

      {noSupabase && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          <p className="font-medium">プロフィールの保存には Supabase の設定が必要です。</p>
          <div className="mt-3">
            <SupabaseSetupGuide backHref="/profile" backLabel="← マイページへ" />
          </div>
        </div>
      )}

      {!isLoggedIn && !noSupabase && (
        <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--accent-soft)]/30 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
          <p>ログインするとプロフィールを編集・保存できます。</p>
          <Link
            href="/login?returnTo=/profile/edit"
            className="mt-2 inline-block font-medium text-[var(--accent)] hover:underline"
          >
            ログインはこちら
          </Link>
        </div>
      )}

      {isLoggedIn && !noSupabase && (
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
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              プロフィール写真（任意）
            </label>
            <p className="mt-1 text-xs text-[var(--foreground-muted)]">
              カメラで撮影するか、アルバムから選択できます
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <input
                ref={avatarFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleAvatarFileSelect}
              />
              <input
                ref={avatarCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleAvatarFileSelect}
              />
              <button
                type="button"
                onClick={() => avatarFileInputRef.current?.click()}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
              >
                アルバムから選択
              </button>
              <button
                type="button"
                onClick={() => avatarCameraInputRef.current?.click()}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
              >
                カメラで撮影
              </button>
              <input
                id="avatarUrl"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="または URL を入力"
                className="flex-1 min-w-[160px] rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              電話番号（任意）
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="例: 090-1234-5678"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label htmlFor="region" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              地域（任意）
            </label>
            <input
              id="region"
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="例: 東京都渋谷区"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              住所（任意）
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="例: 〇〇町1-2-3"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              自己紹介（任意）
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="あなたについて簡単に紹介してください"
              rows={4}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {success && <p className="text-sm text-green-600 dark:text-green-400">保存しました</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "保存中..." : "保存する"}
          </button>
        </form>
      )}
    </div>
  );
}
