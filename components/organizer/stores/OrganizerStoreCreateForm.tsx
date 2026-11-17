"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Infinity as InfinityIcon, Loader2, Store, Truck } from "lucide-react";
import { OrganizerWorkspacePageHeader } from "@/components/organizer/OrganizerWorkspacePageHeader";
import { organizerPathForKind } from "@/lib/stores/draft-shell";
import type { StoreKind, StoreRecord } from "@/lib/stores/types";

type Props = {
  kind?: StoreKind;
};

export function OrganizerStoreCreateForm({ kind = "store" }: Props) {
  const router = useRouter();
  const isKitchen = kind === "kitchen_car";
  const basePath = organizerPathForKind(kind);
  const label = isKitchen ? "キッチンカー" : "店舗";
  const nameLabel = isKitchen ? "キッチンカー名" : "店舗名";

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [tagline, setTagline] = useState("");
  const [hoursLabel, setHoursLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError(`${nameLabel}を入力してください`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/organizer/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          kind,
          category: category.trim() || null,
          tagline: tagline.trim() || null,
          hoursLabel: hoursLabel.trim() || null,
          status: "draft",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "作成に失敗しました");
        return;
      }
      const store = json as StoreRecord;
      router.push(`${basePath}/${store.id}`);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <Link
        href="/organizer/listings"
        className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#2D7A4F] hover:underline"
      >
        <ArrowLeft className="size-3.5" strokeWidth={2.4} aria-hidden />
        掲載管理に戻る
      </Link>

      <OrganizerWorkspacePageHeader
        title={`${label}を作成`}
        subtitle="まずは基本情報を登録します。詳細は作成後に編集できます。"
      />

      {/* 何を作るのか・いつまで載るのかを先に伝える（掲載管理の「期限なし・ずっと掲載」と同じ言い方） */}
      <div className="flex items-center gap-2.5 rounded-[14px] border border-[#e6e2d6] bg-white px-3 py-2.5 min-[900px]:hidden">
        <span
          className={
            isKitchen
              ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#e6f1fa] text-[#2f6fae]"
              : "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#e6f3ea] text-[#2f7d4e]"
          }
          aria-hidden
        >
          {isKitchen ? <Truck className="h-[18px] w-[18px]" /> : <Store className="h-[18px] w-[18px]" />}
        </span>
        <span className="min-w-0 flex-1 text-[12px] leading-snug text-[#6b776f]">
          <span className="flex items-center gap-1 font-bold text-[#173f2c]">
            <InfinityIcon className="h-3.5 w-3.5" aria-hidden />
            期限なし・ずっと掲載
          </span>
          まず下書きで作ります。写真やメニューを入れてから公開できます。
        </span>
      </div>

      <form
        className="org-store-intro rounded-2xl border border-[#d5e2d8] bg-white p-4 min-[900px]:p-5"
        onSubmit={(e) => void handleSubmit(e)}
      >
        <div className="org-store-intro__grid">
          <label className="org-store-intro__field org-store-intro__field--full">
            <span>
              {nameLabel} <em>*</em>
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={80}
              placeholder={
                isKitchen ? "例: まちカフェキッチンカー" : "例: まちカフェ練馬"
              }
              autoFocus
            />
          </label>

          <label className="org-store-intro__field">
            <span>カテゴリ</span>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={
                isKitchen ? "例: カフェ・ドリンク" : "例: カフェ・飲食店"
              }
              maxLength={40}
            />
          </label>

          <label className="org-store-intro__field">
            <span>営業時間</span>
            <input
              type="text"
              value={hoursLabel}
              onChange={(e) => setHoursLabel(e.target.value)}
              placeholder="例: 10:00～18:00"
              maxLength={40}
            />
          </label>

          <label className="org-store-intro__field org-store-intro__field--full">
            <span>キャッチコピー</span>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="短い紹介文を一言で"
              maxLength={120}
            />
          </label>
        </div>

        {error ? <p className="org-store-intro__error">{error}</p> : null}

        <div className="org-store-intro__actions mt-2">
          <button type="submit" className="org-store-intro__save" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                作成中…
              </>
            ) : (
              "作成して編集へ"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
