"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { StoreImageInput } from "@/components/organizer/stores/StoreImageInput";
import {
  normalizePriceYen,
  type StoreMenuInput,
  type StoreMenuRecord,
  type StoreMenuStatus,
} from "@/lib/stores/types";

type Props = {
  storeId: string;
  initial?: StoreMenuRecord | null;
  onCancel: () => void;
  onSaved: (item: StoreMenuRecord) => void;
};

export function StoreMenuEditForm({
  storeId,
  initial = null,
  onCancel,
  onSaved,
}: Props) {
  const isEdit = Boolean(initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [priceYen, setPriceYen] = useState(
    initial != null ? String(initial.priceYen) : "",
  );
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [status, setStatus] = useState<StoreMenuStatus>(
    initial?.status ?? "public",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("商品名を入力してください");
      return;
    }
    const price = normalizePriceYen(priceYen);
    if (price == null) {
      setError("価格を正しく入力してください");
      return;
    }

    setSaving(true);
    setError(null);

    const body: StoreMenuInput = {
      name: name.trim(),
      description: description.trim() || null,
      priceYen: price,
      imageUrl: imageUrl.trim() || null,
      status,
    };

    try {
      const url = isEdit
        ? `/api/organizer/stores/${storeId}/menu/${initial!.id}`
        : `/api/organizer/stores/${storeId}/menu`;
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
      onSaved(json as StoreMenuRecord);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="org-store-news-form" onSubmit={(e) => void handleSubmit(e)}>
      <div className="org-store-news-form__head">
        <h3>{isEdit ? "メニューを編集" : "メニュー・商品を追加"}</h3>
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
            商品名 <em>*</em>
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
            placeholder="例: まちカフェブレンド"
          />
        </label>

        <label className="org-store-news-form__field org-store-news-form__field--full">
          <span>説明</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            maxLength={300}
            placeholder="短い説明文"
          />
        </label>

        <label className="org-store-news-form__field org-store-news-form__field--half">
          <span>
            価格（円） <em>*</em>
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={priceYen}
            onChange={(e) => setPriceYen(e.target.value)}
            required
            placeholder="550"
          />
        </label>

        <label className="org-store-news-form__field org-store-news-form__field--half">
          <span>ステータス</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StoreMenuStatus)}
          >
            <option value="public">公開</option>
            <option value="draft">下書き</option>
          </select>
        </label>

        <div className="org-store-news-form__field org-store-news-form__field--thumb">
          <span>商品画像</span>
          <StoreImageInput
            url={imageUrl}
            onChangeUrl={setImageUrl}
            alt="商品画像"
            kind="menu"
            storeId={storeId}
            hint="メニュー一覧・公開ページに表示されます"
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
            "追加する"
          )}
        </button>
      </div>
    </form>
  );
}
