"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Infinity as InfinityIcon, Loader2, Store, Truck } from "lucide-react";
import { OrganizerWorkspacePageHeader } from "@/components/organizer/OrganizerWorkspacePageHeader";
import { ORG_SERIF, OrgEyebrow } from "@/components/organizer/mobile/organizer-theme";
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

  /** カテゴリの候補（押すと入る。自分で書いてもよい） */
  const categoryChoices = isKitchen
    ? ["カフェ・ドリンク", "軽食", "スイーツ", "ごはん・お弁当", "パン", "お酒"]
    : ["カフェ", "飲食店", "パン・スイーツ", "雑貨", "体験・教室", "宿・観光"];
  const fieldLabel = "flex items-center gap-1.5 text-[13px] font-semibold text-[#1f2a24]";
  const fieldInput =
    "mt-1.5 h-12 w-full rounded-[14px] border border-[#e6e2d6] bg-[#fbfaf6] px-3.5 text-[16px] text-[#1f2a24] outline-none transition placeholder:text-[#a3aaa5] focus:border-[#c9a54e] focus:bg-white";

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 pb-28 min-[900px]:pb-0">
      <Link
        href="/organizer/listings"
        className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#2D7A4F] hover:underline"
      >
        <ArrowLeft className="size-3.5" strokeWidth={2.4} aria-hidden />
        掲載管理に戻る
      </Link>

      {/* PC は今までの見出し */}
      <div className="hidden min-[900px]:block">
        <OrganizerWorkspacePageHeader
          title={`${label}を作成`}
          subtitle="まずは基本情報を登録します。詳細は作成後に編集できます。"
        />
      </div>

      {/* スマホ：見出しと「期限なし・ずっと掲載」を1枚にまとめる */}
      <header className="flex items-center gap-3 min-[900px]:hidden">
        <span
          className={
            isKitchen
              ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#e6f1fa] text-[#2f6fae]"
              : "flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#e6f3ea] text-[#2f7d4e]"
          }
          aria-hidden
        >
          {isKitchen ? <Truck className="h-6 w-6" /> : <Store className="h-6 w-6" />}
        </span>
        <div className="min-w-0">
          <OrgEyebrow>{isKitchen ? "KITCHEN CAR" : "SHOP"}</OrgEyebrow>
          <h1 className="mt-0.5 text-[21px] font-bold leading-tight tracking-[0.04em] text-[#173f2c]" style={{ fontFamily: ORG_SERIF }}>
            {isKitchen ? "キッチンカーを掲載" : "お店を掲載"}
          </h1>
          <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#eef4ef] px-2 py-0.5 text-[11px] font-bold text-[#2f6b4a]">
            <InfinityIcon className="h-3 w-3" aria-hidden />
            期限なし・ずっと掲載
          </p>
        </div>
      </header>

      <form
        id="store-create-form"
        className="space-y-4 rounded-[18px] border border-[#e6e2d6] bg-white p-4 shadow-[0_1px_4px_rgba(23,63,44,0.05)] min-[900px]:p-5"
        onSubmit={(e) => void handleSubmit(e)}
      >
        <p className="text-[12px] leading-relaxed text-[#6b776f]">
          まず4つだけ。写真やメニュー、{isKitchen ? "出店の予定" : "アクセス"}は、作ったあとに入れられます。下書きで作るので、すぐには公開されません。
        </p>

        <label className="block">
          <span className={fieldLabel}>
            {nameLabel}
            <span className="rounded-full bg-[#fbf3e1] px-1.5 py-px text-[10px] font-bold text-[#a3812f]">必須</span>
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
            placeholder={isKitchen ? "例：まちカフェキッチンカー" : "例：まちカフェ練馬"}
            autoFocus
            className={fieldInput}
          />
        </label>

        <div>
          <label className="block">
            <span className={fieldLabel}>
              カテゴリ<span className="text-[10px] font-medium text-[#9aa29c]">任意</span>
            </span>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={isKitchen ? "例：カフェ・ドリンク" : "例：カフェ・飲食店"}
              maxLength={40}
              className={fieldInput}
            />
          </label>
          {/* よくあるカテゴリを押して入れられる */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {categoryChoices.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
                className={
                  category === c
                    ? "min-h-[34px] rounded-full border border-[#173f2c] bg-[#173f2c] px-3 text-[12.5px] font-bold text-[#f6ebc8]"
                    : "min-h-[34px] rounded-full border border-[#e6e2d6] bg-white px-3 text-[12.5px] font-semibold text-[#3f5146]"
                }
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className={fieldLabel}>
            営業時間<span className="text-[10px] font-medium text-[#9aa29c]">任意</span>
          </span>
          <input
            type="text"
            value={hoursLabel}
            onChange={(e) => setHoursLabel(e.target.value)}
            placeholder={isKitchen ? "例：11:00〜15:00（出店日による）" : "例：10:00〜18:00（水曜休み）"}
            maxLength={40}
            className={fieldInput}
          />
        </label>

        <label className="block">
          <span className={fieldLabel}>
            キャッチコピー<span className="text-[10px] font-medium text-[#9aa29c]">任意</span>
          </span>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder={isKitchen ? "例：焼きたてクレープを、まちのあちこちで" : "例：駅前の小さなカフェです"}
            maxLength={120}
            className={fieldInput}
          />
        </label>

        {error ? <p className="org-store-intro__error">{error}</p> : null}

        {/* PC はここにボタン */}
        <div className="hidden justify-end min-[900px]:flex">
          <button type="submit" className="org-store-intro__save" disabled={saving}>
            {saving ? "作成中…" : "作成して編集へ"}
          </button>
        </div>
      </form>

      {/* スマホ：作るボタンは画面の下に固定（下のナビは作成中は出さない） */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e8e6e0] bg-white/95 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] backdrop-blur min-[900px]:hidden">
        <button
          type="submit"
          form="store-create-form"
          disabled={saving || !name.trim()}
          className="flex h-12 w-full items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-[#d9bc6e] bg-gradient-to-b from-[#245a3e] to-[#173f2c] text-[15px] font-bold text-[#f6ebc8] shadow-[0_4px_12px_rgba(14,42,29,0.22)] disabled:border-[#e3ece5] disabled:from-[#eef1ec] disabled:to-[#eef1ec] disabled:text-[#7b877f] disabled:shadow-none"
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              作成中…
            </>
          ) : name.trim() ? (
            "下書きを作って、くわしく入れる"
          ) : (
            `${nameLabel}を入れると作れます`
          )}
        </button>
      </div>
    </div>
  );
}
