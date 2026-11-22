"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Check, Clock, Infinity as InfinityIcon, Loader2, MapPin, Store, Truck, UtensilsCrossed } from "lucide-react";
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

  const backHref = isKitchen ? "/organizer/listings?kind=kitchen" : "/organizer/listings?kind=store";
  const laterItems = isKitchen
    ? [
        { Icon: Camera, label: "写真" },
        { Icon: UtensilsCrossed, label: "メニュー" },
        { Icon: MapPin, label: "出店の予定" },
      ]
    : [
        { Icon: Camera, label: "写真" },
        { Icon: UtensilsCrossed, label: "メニュー" },
        { Icon: MapPin, label: "アクセス" },
      ];
  const accent = isKitchen ? { color: "#2f6fae", bg: "#e6f1fa" } : { color: "#2f7d4e", bg: "#e6f3ea" };

  return (
    <div className="store-create mx-auto w-full max-w-xl space-y-4 pb-28 min-[900px]:max-w-none min-[900px]:space-y-0 min-[900px]:pb-0">
      {/* PC・iPad 横：イベント・ボランティアの作成と同じ上の帯（戻る・見出し・作る） */}
      <div className="sticky top-0 z-10 -mx-6 -mt-2.5 mb-5 hidden items-center gap-4 border-b border-[#d8d4cc] bg-white px-6 py-2 shadow-[0_1px_0_rgba(15,23,42,0.04)] min-[900px]:flex">
        <Link href={backHref} className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-[#4a4844] hover:text-[#173f2c]">
          <ArrowLeft className="size-3" strokeWidth={2.2} aria-hidden />
          掲載管理に戻る
        </Link>
        <div className="flex min-w-0 flex-1 items-baseline justify-center gap-2.5">
          <OrgEyebrow>{isKitchen ? "KITCHEN CAR" : "SHOP"}</OrgEyebrow>
          <span className="truncate text-[15px] font-semibold tracking-[0.04em] text-[#173f2c]" style={{ fontFamily: ORG_SERIF }}>
            {isKitchen ? "キッチンカーを掲載" : "お店を掲載"}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#eef4ef] px-2 py-0.5 text-[10.5px] font-bold text-[#2f6b4a]">
            <InfinityIcon className="h-3 w-3" aria-hidden />
            期限なし・ずっと掲載
          </span>
        </div>
        <button
          type="submit"
          form="store-create-form"
          disabled={saving}
          className="flex min-w-[7rem] shrink-0 items-center justify-center gap-1 rounded-[8px] bg-[#173f2c] px-4 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#0e2a1d] disabled:opacity-60"
        >
          {saving ? "作成中…" : "作成して編集へ"}
        </button>
      </div>

      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#2D7A4F] hover:underline min-[900px]:hidden"
      >
        <ArrowLeft className="size-3.5" strokeWidth={2.4} aria-hidden />
        掲載管理に戻る
      </Link>

      {/* 見出しと「期限なし・ずっと掲載」を1枚にまとめる（スマホ・PC 共通。イベント・ボランティアの作成と同じ見出しの形） */}
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

      <div className="min-[900px]:mx-auto min-[900px]:grid min-[900px]:max-w-[1040px] min-[900px]:grid-cols-[minmax(0,1fr)_320px] min-[900px]:items-start min-[900px]:gap-5">
      <form
        id="store-create-form"
        className="space-y-4 rounded-[18px] border border-[#e6e2d6] bg-white p-4 shadow-[0_1px_4px_rgba(23,63,44,0.05)] min-[900px]:p-6"
        onSubmit={(e) => void handleSubmit(e)}
      >
        <p className="text-[12px] leading-relaxed text-[#6b776f] min-[900px]:hidden">
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

        {/* 広い PC：営業時間とキャッチコピーを横に並べる */}
        <div className="space-y-4 min-[1200px]:grid min-[1200px]:grid-cols-2 min-[1200px]:gap-4 min-[1200px]:space-y-0">
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
        </div>

        {error ? <p className="org-store-intro__error">{error}</p> : null}

        {/* PC はここにもボタン（上の帯と同じ働き） */}
        <div className="hidden justify-end min-[900px]:flex">
          <button type="submit" className="org-store-intro__save" disabled={saving}>
            {saving ? "作成中…" : "作成して編集へ"}
          </button>
        </div>
      </form>

      {/* PC：右に「利用者にはこう見えます」の見本と、作ったあとに入れられるもの */}
      <aside className="hidden space-y-3 min-[900px]:sticky min-[900px]:top-[calc(var(--mg-pc-top-nav-h,52px)+4rem)] min-[900px]:block">
        <p className="px-1 text-[11.5px] font-bold tracking-[0.06em] text-[#a3812f]">利用者にはこう見えます</p>
        <div className="overflow-hidden rounded-[18px] border border-[#e6e2d6] bg-white shadow-[0_4px_16px_rgba(23,63,44,0.07)]">
          <div className="flex aspect-[16/9] items-center justify-center" style={{ background: accent.bg, color: accent.color }}>
            {isKitchen ? <Truck className="h-10 w-10 opacity-70" aria-hidden /> : <Store className="h-10 w-10 opacity-70" aria-hidden />}
          </div>
          <div className="space-y-1.5 p-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full px-2 py-0.5 text-[10.5px] font-bold" style={{ background: accent.bg, color: accent.color }}>
                {isKitchen ? "キッチンカー" : "お店"}
              </span>
              {category.trim() ? (
                <span className="rounded-full border border-[#e6e2d6] px-2 py-0.5 text-[10.5px] font-semibold text-[#5f6d64]">{category.trim()}</span>
              ) : null}
            </div>
            <p className={`text-[16px] font-bold leading-snug ${name.trim() ? "text-[#163828]" : "text-[#b8beb9]"}`} style={{ fontFamily: ORG_SERIF }}>
              {name.trim() || nameLabel}
            </p>
            <p className={`text-[12.5px] leading-relaxed ${tagline.trim() ? "text-[#4a5a50]" : "text-[#b8beb9]"}`}>
              {tagline.trim() || "キャッチコピーがここに出ます"}
            </p>
            {hoursLabel.trim() ? (
              <p className="flex items-center gap-1 text-[11.5px] text-[#6b776f]">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                {hoursLabel.trim()}
              </p>
            ) : null}
          </div>
        </div>
        <div className="rounded-[16px] border border-[#e6e2d6] bg-[#fbfaf6] p-3.5">
          <p className="mb-2 text-[12px] font-bold text-[#173f2c]">作ったあとに入れられるもの</p>
          <ul className="space-y-1.5">
            {laterItems.map(({ Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-[12px] text-[#4a5a50]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#2f7d4e] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </span>
                {label}
              </li>
            ))}
          </ul>
          <p className="mt-2.5 flex items-start gap-1 text-[11px] leading-relaxed text-[#6b776f]">
            <Check className="mt-0.5 h-3 w-3 shrink-0 text-[#2f7d4e]" aria-hidden />
            下書きで作るので、すぐには公開されません。
          </p>
        </div>
      </aside>
      </div>

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
