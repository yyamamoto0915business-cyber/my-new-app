"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import type { CategoryKey } from "@/lib/categories";
import { CATEGORY_KEYS, CATEGORY_LABELS } from "@/lib/categories";

export default function OrganizerProfileSettingsPage() {
  const { user } = useSupabaseUser();
  const [organizerId, setOrganizerId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [shortBio, setShortBio] = useState("");
  const [bio, setBio] = useState("");
  const [activityArea, setActivityArea] = useState("");
  const [categories, setCategories] = useState<CategoryKey[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [xUrl, setXUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [publicEmail, setPublicEmail] = useState("");
  const [publicPhone, setPublicPhone] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [coverError, setCoverError] = useState(false);

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
          .select("id, organization_name, contact_email, contact_phone")
          .eq("profile_id", user.id)
          .maybeSingle();
        if (!cancelled && data) {
          const oid = (data.id as string) ?? null;
          setOrganizerId(oid);
          setOrganizationName((data.organization_name as string) ?? "");
          setContactEmail((data.contact_email as string) ?? "");
          setContactPhone((data.contact_phone as string) ?? "");

          if (oid) {
            const { data: profileData } = await supabase
              .from("organizer_profiles")
              .select(
                "display_name, avatar_url, short_bio, bio, activity_area, categories, cover_image_url, gallery_images, website_url, instagram_url, x_url, facebook_url, public_email, public_phone, show_email, show_phone"
              )
              .eq("organizer_id", oid)
              .maybeSingle();
            if (!cancelled && profileData) {
              setDisplayName((profileData.display_name as string) ?? "");
              setAvatarUrl((profileData.avatar_url as string) ?? "");
              setShortBio((profileData.short_bio as string) ?? "");
              setBio((profileData.bio as string) ?? "");
              setActivityArea((profileData.activity_area as string) ?? "");
              setCategories(
                Array.isArray(profileData.categories)
                  ? (profileData.categories as string[]).filter((x): x is CategoryKey =>
                      (CATEGORY_KEYS as readonly string[]).includes(x)
                    )
                  : []
              );
              setCoverImageUrl((profileData.cover_image_url as string) ?? "");
              setGalleryImages(
                Array.isArray(profileData.gallery_images)
                  ? (profileData.gallery_images as string[]).filter((x) => typeof x === "string")
                  : []
              );
              setWebsiteUrl((profileData.website_url as string) ?? "");
              setInstagramUrl((profileData.instagram_url as string) ?? "");
              setXUrl((profileData.x_url as string) ?? "");
              setFacebookUrl((profileData.facebook_url as string) ?? "");
              setPublicEmail((profileData.public_email as string) ?? "");
              setPublicPhone((profileData.public_phone as string) ?? "");
              setShowEmail(Boolean(profileData.show_email));
              setShowPhone(Boolean(profileData.show_phone));
            }
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const uploadPublicImage = async (bucket: string, path: string, file: File) => {
    const supabase = createClient();
    if (!supabase) throw new Error("ストレージが利用できません");
    if (!file.type.startsWith("image/")) {
      throw new Error("画像ファイルを選択してください");
    }
    const maxSize =
      bucket === "organizer-avatars" ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(
        bucket === "organizer-avatars"
          ? "画像サイズが大きすぎます（最大5MB）"
          : "画像サイズが大きすぎます（最大10MB）"
      );
    }
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleAvatarFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;

    const supabase = createClient();
    if (!supabase || !user?.id || !organizerId) return;

    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/organizer-avatar.${ext}`;
      const publicUrl = await uploadPublicImage(
        "organizer-avatars",
        path,
        file
      );
      setAvatarError(false);
      setAvatarUrl(publicUrl);

      const { error: upsertError } = await supabase
        .from("organizer_profiles")
        .upsert(
          {
            organizer_id: organizerId,
            avatar_url: publicUrl,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "organizer_id" }
        );
      if (upsertError) throw upsertError;
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "アップロードに失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleCoverFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;

    const supabase = createClient();
    if (!supabase || !user?.id || !organizerId) return;

    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/organizer-cover.${ext}`;
      const publicUrl = await uploadPublicImage(
        "organizer-covers",
        path,
        file
      );
      setCoverError(false);
      setCoverImageUrl(publicUrl);

      const { error: upsertError } = await supabase
        .from("organizer_profiles")
        .upsert(
          {
            organizer_id: organizerId,
            cover_image_url: publicUrl,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "organizer_id" }
        );
      if (upsertError) throw upsertError;
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "アップロードに失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleGalleryFilesSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;

    const supabase = createClient();
    if (!supabase || !user?.id || !organizerId) return;

    const remaining = Math.max(0, 6 - galleryImages.length);
    const toUpload = images.slice(0, remaining);
    if (toUpload.length === 0) {
      setError("ギャラリー画像は最大6枚までです");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const uploadedUrls: string[] = [];
      for (const file of toUpload) {
        const ext = file.name.split(".").pop() || "jpg";
        const name = `${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
        const path = `${user.id}/${name}`;
        const publicUrl = await uploadPublicImage(
          "organizer-gallery",
          path,
          file
        );
        uploadedUrls.push(publicUrl);
      }

      const next = [...galleryImages, ...uploadedUrls].slice(0, 6);
      setGalleryImages(next);

      const { error: upsertError } = await supabase
        .from("organizer_profiles")
        .upsert(
          {
            organizer_id: organizerId,
            gallery_images: next,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "organizer_id" }
        );
      if (upsertError) throw upsertError;
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "アップロードに失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const removeGalleryImageAt = (idx: number) => {
    const next = galleryImages.filter((_, i) => i !== idx);
    setGalleryImages(next);
  };

  const toggleCategory = (key: CategoryKey) => {
    setCategories((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

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

      if (!organizerId) {
        throw new Error("主催者情報の取得に失敗しました");
      }

      const { error: profileUpsertError } = await supabase
        .from("organizer_profiles")
        .upsert(
          {
            organizer_id: organizerId,
            display_name: displayName.trim() || null,
            avatar_url: avatarUrl.trim() || null,
            cover_image_url: coverImageUrl.trim() || null,
            gallery_images: galleryImages,
            categories,
            short_bio: shortBio.trim() || null,
            bio: bio.trim() || null,
            activity_area: activityArea.trim() || null,
            website_url: websiteUrl.trim() || null,
            instagram_url: instagramUrl.trim() || null,
            x_url: xUrl.trim() || null,
            facebook_url: facebookUrl.trim() || null,
            public_email: publicEmail.trim() || null,
            public_phone: publicPhone.trim() || null,
            show_email: showEmail,
            show_phone: showPhone,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "organizer_id" }
        );
      if (profileUpsertError) throw profileUpsertError;

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

        <form onSubmit={handleSubmit} className="space-y-6 pb-24">
          {/* 基本情報 */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-semibold text-slate-900">基本情報</h2>
            <p className="mt-1 text-sm text-slate-500">
              主催者としての基本情報です（必須/任意を確認してください）
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="organizationName"
                  className="block text-sm font-medium text-slate-700"
                >
                  主催者名 / 団体名 <span className="text-amber-600">必須</span>
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
                  htmlFor="displayName"
                  className="block text-sm font-medium text-slate-700"
                >
                  公開表示名（任意）
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="未入力なら「主催者名 / 団体名」を使用します"
                  className={inputBase}
                />
              </div>

              <div>
                <label
                  htmlFor="activityArea"
                  className="block text-sm font-medium text-slate-700"
                >
                  活動地域（任意）
                </label>
                <input
                  id="activityArea"
                  type="text"
                  value={activityArea}
                  onChange={(e) => setActivityArea(e.target.value)}
                  placeholder="例：東京都渋谷区 / 長野県松本市"
                  className={inputBase}
                />
              </div>

              <div>
                <p className="block text-sm font-medium text-slate-700">
                  主なカテゴリ（任意・複数選択）
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CATEGORY_KEYS.map((key) => {
                    const active = categories.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleCategory(key)}
                        className={[
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                          active
                            ? "border-slate-300 bg-slate-900 text-white"
                            : "border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50",
                        ].join(" ")}
                        aria-pressed={active}
                      >
                        {CATEGORY_LABELS[key]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* 紹介文 */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-semibold text-slate-900">紹介文</h2>
            <p className="mt-1 text-sm text-slate-500">
              信頼感・雰囲気・活動内容が伝わるように記載できます
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="shortBio"
                  className="block text-sm font-medium text-slate-700"
                >
                  一言紹介（任意）
                </label>
                <input
                  id="shortBio"
                  type="text"
                  value={shortBio}
                  onChange={(e) => setShortBio(e.target.value)}
                  placeholder="例：地域の魅力を伝える体験づくりをしています"
                  className={inputBase}
                  maxLength={120}
                />
                <p className="mt-1 text-xs text-slate-500">
                  80文字程度がおすすめです（注目の主催者に表示）
                </p>
              </div>

              <div>
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-slate-700"
                >
                  詳細紹介（任意）
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="主催者について、活動への想い、参加者へのメッセージなど"
                  rows={6}
                  className={inputBase}
                />
              </div>
            </div>
          </section>

          {/* 画像 */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-semibold text-slate-900">画像</h2>
            <p className="mt-1 text-sm text-slate-500">
              画像はアップロード後すぐにプレビューできます（未設定でもOK）
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <p className="block text-sm font-medium text-slate-700">
                  カバー画像（任意）
                </p>
                <div className="mt-2 space-y-2">
                  {coverImageUrl && !coverError ? (
                    <div className="relative aspect-[16/6] w-full overflow-hidden rounded-2xl bg-slate-100">
                      <Image
                        src={coverImageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 768px"
                        onError={() => setCoverError(true)}
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[16/6] w-full items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">
                      未設定（推奨）
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleCoverFileSelect}
                    className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200/60"
                    disabled={!organizerId || saving}
                  />
                  <input
                    id="coverImageUrl"
                    type="url"
                    value={coverImageUrl}
                    onChange={(e) => {
                      setCoverError(false);
                      setCoverImageUrl(e.target.value);
                    }}
                    placeholder="または URL を入力"
                    className={inputBase}
                  />
                </div>
              </div>

              <div>
                <p className="block text-sm font-medium text-slate-700">
                  プロフィール画像（任意）
                </p>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="shrink-0">
                    {avatarUrl && !avatarError ? (
                      <div className="relative h-16 w-16 overflow-hidden rounded-full bg-slate-100">
                        <Image
                          src={avatarUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="64px"
                          onError={() => setAvatarError(true)}
                        />
                      </div>
                    ) : (
                      <div
                        className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-500"
                        aria-hidden
                      >
                        {(organizationName.trim() || "主").slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleAvatarFileSelect}
                      className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200/60"
                      disabled={!organizerId || saving}
                    />
                    <input
                      id="avatarUrl"
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => {
                        setAvatarError(false);
                        setAvatarUrl(e.target.value);
                      }}
                      placeholder="または URL を入力"
                      className={inputBase}
                    />
                  </div>
                </div>
              </div>

              <div>
                <p className="block text-sm font-medium text-slate-700">
                  ギャラリー（任意・最大6枚）
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {galleryImages.map((url, idx) => (
                    <div
                      key={`${url}-${idx}`}
                      className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100"
                    >
                      <Image
                        src={url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="120px"
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryImageAt(idx)}
                        className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-1 text-[11px] font-semibold text-white opacity-0 transition group-hover:opacity-100"
                      >
                        削除
                      </button>
                    </div>
                  ))}
                  {galleryImages.length < 6 && (
                    <label className="flex aspect-square cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50">
                      追加
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        multiple
                        onChange={handleGalleryFilesSelect}
                        className="hidden"
                        disabled={!organizerId || saving}
                      />
                    </label>
                  )}
                </div>
                {galleryImages.length > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!organizerId) return;
                      const supabase = createClient();
                      if (!supabase) return;
                      setSaving(true);
                      setError(null);
                      setSuccess(false);
                      try {
                        const { error: upsertError } = await supabase
                          .from("organizer_profiles")
                          .upsert(
                            {
                              organizer_id: organizerId,
                              gallery_images: [],
                              updated_at: new Date().toISOString(),
                            },
                            { onConflict: "organizer_id" }
                          );
                        if (upsertError) throw upsertError;
                        setGalleryImages([]);
                        setSuccess(true);
                      } catch (e) {
                        setError(
                          e instanceof Error ? e.message : "更新に失敗しました"
                        );
                      } finally {
                        setSaving(false);
                      }
                    }}
                    className="mt-3 text-xs font-medium text-slate-600 hover:underline"
                  >
                    すべて削除
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* SNS / 外部リンク */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-semibold text-slate-900">
              SNS / 外部リンク
            </h2>

            <div className="mt-4 space-y-3">
              <div>
                <label
                  htmlFor="websiteUrl"
                  className="block text-xs font-medium text-slate-600"
                >
                  公式サイト（任意）
                </label>
                <input
                  id="websiteUrl"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  className={inputBase}
                />
              </div>
              <div>
                <label
                  htmlFor="instagramUrl"
                  className="block text-xs font-medium text-slate-600"
                >
                  Instagram（任意）
                </label>
                <input
                  id="instagramUrl"
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://www.instagram.com/..."
                  className={inputBase}
                />
              </div>
              <div>
                <label
                  htmlFor="xUrl"
                  className="block text-xs font-medium text-slate-600"
                >
                  X（任意）
                </label>
                <input
                  id="xUrl"
                  type="url"
                  value={xUrl}
                  onChange={(e) => setXUrl(e.target.value)}
                  placeholder="https://x.com/..."
                  className={inputBase}
                />
              </div>
              <div>
                <label
                  htmlFor="facebookUrl"
                  className="block text-xs font-medium text-slate-600"
                >
                  Facebook（任意）
                </label>
                <input
                  id="facebookUrl"
                  type="url"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  placeholder="https://www.facebook.com/..."
                  className={inputBase}
                />
              </div>
            </div>
          </section>

          {/* 公開連絡先 */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-semibold text-slate-900">公開連絡先</h2>
            <p className="mt-1 text-sm text-slate-500">
              公開ONのものだけ主催者ページに表示されます（電話番号は非公開推奨）
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label
                  htmlFor="publicEmail"
                  className="block text-xs font-medium text-slate-600"
                >
                  公開メール（任意）
                </label>
                <input
                  id="publicEmail"
                  type="email"
                  value={publicEmail}
                  onChange={(e) => setPublicEmail(e.target.value)}
                  placeholder="contact@example.com"
                  className={inputBase}
                />
                <label className="mt-2 inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={showEmail}
                    onChange={(e) => setShowEmail(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  メールを公開する
                </label>
              </div>

              <div>
                <label
                  htmlFor="publicPhone"
                  className="block text-xs font-medium text-slate-600"
                >
                  公開電話番号（任意）
                </label>
                <input
                  id="publicPhone"
                  type="tel"
                  value={publicPhone}
                  onChange={(e) => setPublicPhone(e.target.value)}
                  placeholder="090-1234-5678"
                  className={inputBase}
                />
                <label className="mt-2 inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={showPhone}
                    onChange={(e) => setShowPhone(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  電話番号を公開する（非公開推奨）
                </label>
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
              {organizerId ? (
                <>
                  {" "}
                  <Link
                    href={`/organizers/${organizerId}`}
                    className="font-medium underline underline-offset-2 hover:text-emerald-800"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    公開ページを確認
                  </Link>
                </>
              ) : null}
            </p>
          )}

          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-sm">
            <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-500">
                {success ? "保存しました" : "入力内容を確認して保存してください"}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-[44px] w-full rounded-xl bg-[var(--mg-accent,theme(colors.amber.600))] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {saving ? "保存中..." : "保存する"}
                </button>
                <Link
                  href="/organizer/settings"
                  className="min-h-[44px] flex items-center justify-center rounded-xl border border-slate-200/80 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                >
                  戻る
                </Link>
              </div>
            </div>
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
