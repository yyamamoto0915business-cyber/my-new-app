"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { StoreImageInput } from "@/components/organizer/stores/StoreImageInput";
import {
  newsCategoryDefsForKind,
  type StoreKind,
  type StoreNewsCategory,
  type StoreNewsInput,
  type StoreNewsRecord,
  type StoreNewsStatus,
} from "@/lib/stores/types";

type Props = {
  storeId: string;
  kind?: StoreKind;
  initial?: StoreNewsRecord | null;
  onCancel: () => void;
  onSaved: (news: StoreNewsRecord) => void;
};

export function StoreNewsEditForm({
  storeId,
  kind = "store",
  initial = null,
  onCancel,
  onSaved,
}: Props) {
  const isEdit = Boolean(initial);
  const isKitchen = kind === "kitchen_car";
  const categoryDefs = newsCategoryDefsForKind(kind);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [category, setCategory] = useState<StoreNewsCategory>(
    initial?.category ?? "sale",
  );
  const [status, setStatus] = useState<StoreNewsStatus>(
    initial?.status ?? "public",
  );
  const [periodStart, setPeriodStart] = useState(initial?.periodStart ?? "");
  const [periodEnd, setPeriodEnd] = useState(initial?.periodEnd ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnailUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("タイトルを入力してください");
      return;
    }
    setSaving(true);
    setError(null);

    const body: StoreNewsInput = {
      title: title.trim(),
      excerpt: excerpt.trim() || null,
      category,
      status,
      periodStart: periodStart || null,
      periodEnd: periodEnd || null,
      thumbnailUrl: thumbnailUrl.trim() || null,
    };

    try {
      const url = isEdit
        ? `/api/organizer/stores/${storeId}/news/${initial!.id}`
        : `/api/organizer/stores/${storeId}/news`;
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "保存に失敗しました");
        return;
      }
      onSaved(json as StoreNewsRecord);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="org-store-news-form" onSubmit={(e) => void handleSubmit(e)}>
      <div className="org-store-news-form__head">
        <h3>{isEdit ? "ニュースを編集" : isKitchen ? "ニュースを作成" : "店舗ニュースを作成"}</h3>
        <button
          type="button"
          className="org-store-news-form__close"
          onClick={onCancel}
          aria-label="閉じる"
        >
          <X className="size-4" strokeWidth={2.2} />
        </button>
      </div>

      <div className="org-store-news-form__grid">
        <label className="org-store-news-form__field org-store-news-form__field--full">
          <span>
            タイトル <em>*</em>
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={100}
            placeholder="例: 季節のフルーツパフェ 10%OFF！"
          />
        </label>

        <label className="org-store-news-form__field org-store-news-form__field--full">
          <span>本文プレビュー</span>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            maxLength={300}
            placeholder="一覧に表示する短い説明"
          />
        </label>

        <label className="org-store-news-form__field">
          <span>種類</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as StoreNewsCategory)}
          >
            {categoryDefs.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="org-store-news-form__field">
          <span>ステータス</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StoreNewsStatus)}
          >
            <option value="public">公開中</option>
            <option value="draft">下書き</option>
            <option value="ended">終了</option>
          </select>
        </label>

        <label className="org-store-news-form__field">
          <span>掲載開始日</span>
          <input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
          />
        </label>

        <label className="org-store-news-form__field">
          <span>掲載終了日</span>
          <input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
          />
        </label>

        <div className="org-store-news-form__field org-store-news-form__field--thumb">
          <span>サムネイル画像</span>
          <StoreImageInput
            url={thumbnailUrl}
            onChangeUrl={setThumbnailUrl}
            alt="ニュース画像"
            kind="news"
            storeId={storeId}
            hint="一覧のサムネイルに使われます"
            inline
          />
        </div>
      </div>

      {error ? <p className="org-store-news-form__error">{error}</p> : null}

      <div className="org-store-news-form__actions">
        <button
          type="button"
          className="org-store-news-form__cancel"
          onClick={onCancel}
          disabled={saving}
        >
          キャンセル
        </button>
        <button type="submit" className="org-store-news-form__save" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              保存中…
            </>
          ) : isEdit ? (
            "変更を保存"
          ) : (
            "作成する"
          )}
        </button>
      </div>
    </form>
  );
}
