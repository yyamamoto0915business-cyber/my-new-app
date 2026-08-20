"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { StoreImageInput } from "@/components/organizer/stores/StoreImageInput";
import { StoreGalleryImagesInput } from "@/components/organizer/stores/StoreGalleryImagesInput";
import {
  featureDefsForKind,
  type StoreFeatureKey,
  type StoreIntroUpdateInput,
  type StoreRecord,
} from "@/lib/stores/types";
import {
  isStoreNameUnset,
} from "@/lib/stores/draft-shell";

type Props = {
  store: StoreRecord;
  onSaved: (store: StoreRecord) => void;
};

export function StoreIntroEditForm({ store, onSaved }: Props) {
  const isKitchen = store.kind === "kitchen_car";
  const featureDefs = featureDefsForKind(store.kind);
  const nameLabel = isKitchen ? "キッチンカー名" : "店舗名";
  const [name, setName] = useState(
    isStoreNameUnset(store) ? "" : store.name,
  );
  const [category, setCategory] = useState(store.category ?? "");
  const [tagline, setTagline] = useState(store.tagline ?? "");
  const [description, setDescription] = useState(store.description ?? "");
  const [hoursLabel, setHoursLabel] = useState(store.hoursLabel ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(store.coverImageUrl ?? "");
  const [galleryImages, setGalleryImages] = useState<string[]>(store.galleryImages);
  const [features, setFeatures] = useState<StoreFeatureKey[]>(store.features);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  // ヒーローからのカバー追加など、外部更新をフォームに反映
  useEffect(() => {
    setName(isStoreNameUnset(store) ? "" : store.name);
    setCategory(store.category ?? "");
    setTagline(store.tagline ?? "");
    setDescription(store.description ?? "");
    setHoursLabel(store.hoursLabel ?? "");
    setCoverImageUrl(store.coverImageUrl ?? "");
    setGalleryImages(store.galleryImages);
    setFeatures(store.features);
  }, [store.id, store.updatedAt]);

  function toggleFeature(key: StoreFeatureKey) {
    setFeatures((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError(`${nameLabel}を入力してください`);
      return;
    }
    setSaving(true);
    setError(null);
    setSavedFlash(false);

    const body: StoreIntroUpdateInput = {
      name: name.trim(),
      category: category.trim() || null,
      tagline: tagline.trim() || null,
      description: description.trim() || null,
      // キッチンカーの営業時間はアクセスタブで編集
      ...(isKitchen ? {} : { hoursLabel: hoursLabel.trim() || null }),
      coverImageUrl: coverImageUrl.trim() || null,
      galleryImages,
      features,
    };

    try {
      const res = await fetch(`/api/organizer/stores/${store.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "保存に失敗しました");
        return;
      }
      onSaved(json as StoreRecord);
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 2200);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className={cn("org-store-intro", isKitchen && "org-store-intro--kitchen")}
      onSubmit={handleSubmit}
    >
      <div className="org-store-intro__grid">
        <label className="org-store-intro__field">
          <span>{nameLabel} <em>*</em></span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
          />
        </label>

        <label className="org-store-intro__field">
          <span>カテゴリ</span>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder={isKitchen ? "例: カフェ・ドリンク" : "例: カフェ・飲食店"}
            maxLength={40}
          />
        </label>

        <label
          className={cn(
            "org-store-intro__field",
            isKitchen && "org-store-intro__field--full",
          )}
        >
          <span>キャッチコピー</span>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="短い紹介文を一言で"
            maxLength={120}
          />
        </label>

        {!isKitchen ? (
          <label className="org-store-intro__field">
            <span>営業時間（表示用）</span>
            <input
              type="text"
              value={hoursLabel}
              onChange={(e) => setHoursLabel(e.target.value)}
              placeholder="例: 10:00～18:00"
              maxLength={40}
            />
          </label>
        ) : null}

        <label className="org-store-intro__field org-store-intro__field--full">
          <span>紹介文</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={isKitchen ? 2 : 3}
            placeholder={
              isKitchen
                ? "キッチンカーのこだわりや出店スタイルを書いてください"
                : "店舗の雰囲気やこだわりを書いてください"
            }
            maxLength={2000}
          />
        </label>
      </div>

      <div className="org-store-intro__media">
        <div>
          <p className="org-store-intro__media-label">カバー画像</p>
          <StoreImageInput
            url={coverImageUrl}
            onChangeUrl={setCoverImageUrl}
            alt="カバー画像"
            kind="cover"
            storeId={store.id}
            hint={isKitchen ? undefined : "ヒーローに大きく表示されます"}
            compact
            inline={isKitchen}
          />
        </div>
        <div>
          <p className="org-store-intro__media-label">ギャラリー</p>
          <StoreGalleryImagesInput
            urls={galleryImages}
            onChange={setGalleryImages}
            storeId={store.id}
            compact
          />
        </div>
      </div>

      <fieldset className="org-store-intro__features">
        <legend>特徴タグ</legend>
        <div className="org-store-intro__feature-list">
          {featureDefs.map((f) => {
            const checked = features.includes(f.key);
            return (
              <label
                key={f.key}
                className={cn("org-store-intro__feature-chip", checked && "is-on")}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleFeature(f.key)}
                  className="sr-only"
                />
                {f.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      {error ? <p className="org-store-intro__error">{error}</p> : null}
      {savedFlash ? (
        <p className="org-store-intro__ok" role="status">
          保存しました
        </p>
      ) : null}

      <div className="org-store-intro__actions">
        <button type="submit" className="org-store-intro__save" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              保存中…
            </>
          ) : (
            "変更を保存"
          )}
        </button>
      </div>
    </form>
  );
}
