"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ImagePlus,
  Loader2,
  MapPin,
  Plus,
  Share2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { OrganizerGameEventOption } from "@/lib/organizer/games";
import {
  PHOTO_CATEGORIES,
  PHOTO_SAMPLE_IMAGES,
  PHOTO_THEME_COLORS,
  createPhotoSpot,
  samplePhotoSpots,
  type PhotoSpot,
} from "@/lib/organizer/photo";
import { OrganizerPhotoPreview } from "@/components/organizer/games/OrganizerPhotoPreview";
import { GamePublishSuccess } from "@/components/organizer/games/GamePublishSuccess";

const STEPS = [
  { id: "basic", label: "基本設定" },
  { id: "spots", label: "スポット設定" },
  { id: "rules", label: "ルール設定" },
  { id: "design", label: "デザイン設定" },
  { id: "publish", label: "公開設定" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

function toIsoFromDateTime(date: string, time: string): string | null {
  if (!date) return null;
  const value = new Date(`${date}T${time || "00:00"}:00+09:00`);
  if (Number.isNaN(value.getTime())) return null;
  return value.toISOString();
}

function formatPeriod(startDate: string, startTime: string, endDate: string, endTime: string): string | null {
  const fmt = (date: string, time: string) => {
    if (!date) return "";
    const value = new Date(`${date}T${time || "00:00"}:00+09:00`);
    if (Number.isNaN(value.getTime())) return date;
    return `${date.replaceAll("-", "/")} ${time || "00:00"}`;
  };
  if (startDate && endDate) return `${fmt(startDate, startTime)} 〜 ${fmt(endDate, endTime)}`;
  if (startDate) return `${fmt(startDate, startTime)} から`;
  if (endDate) return `${fmt(endDate, endTime)} まで`;
  return null;
}

export function OrganizerPhotoCreateForm() {
  const router = useRouter();
  const [step, setStep] = useState<StepId>("basic");
  const [name, setName] = useState("春のまち歩きフォトラリー");
  const [description, setDescription] = useState("まちのスポットを巡って写真を撮りながら地域の魅力を見つけよう！");
  const [eventId, setEventId] = useState("");
  const [startDate, setStartDate] = useState("2026-03-20");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("2026-04-20");
  const [endTime, setEndTime] = useState("18:00");
  const [events, setEvents] = useState<OrganizerGameEventOption[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [mainImage, setMainImage] = useState<(typeof PHOTO_SAMPLE_IMAGES)[number]>(PHOTO_SAMPLE_IMAGES[1]);
  const [category, setCategory] = useState<(typeof PHOTO_CATEGORIES)[number]>(PHOTO_CATEGORIES[0]);
  const [tags, setTags] = useState<string[]>(["桜", "まち歩き", "観光"]);
  const [tagDraft, setTagDraft] = useState("");
  const [spots, setSpots] = useState<PhotoSpot[]>(() => samplePhotoSpots());
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [clearCount, setClearCount] = useState(3);
  const [photoRequired, setPhotoRequired] = useState(true);
  const [pointsOn, setPointsOn] = useState(true);
  const [couponOn, setCouponOn] = useState(true);
  const [prizeOn, setPrizeOn] = useState(false);
  const [points, setPoints] = useState(50);
  const [coverImage, setCoverImage] = useState<(typeof PHOTO_SAMPLE_IMAGES)[number]>(PHOTO_SAMPLE_IMAGES[1]);
  const [themeColor, setThemeColor] = useState<(typeof PHOTO_THEME_COLORS)[number]["value"]>(
    PHOTO_THEME_COLORS[0].value,
  );
  const [previewTab, setPreviewTab] = useState<"cover" | "spots" | "rewards">("cover");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchWithTimeout("/api/organizer/games?events=1&games=0", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || cancelled) return;
        setEvents((json.events ?? []) as OrganizerGameEventOption[]);
      } catch {
        if (!cancelled) setEvents([]);
      } finally {
        if (!cancelled) setLoadingEvents(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const max = Math.max(spots.length, 1);
    if (clearCount > max) setClearCount(max);
  }, [spots.length, clearCount]);

  const stepIndex = STEPS.findIndex((item) => item.id === step);
  const periodLabel = formatPeriod(startDate, startTime, endDate, endTime);
  const editing = spots.find((spot) => spot.key === editingKey) ?? null;
  const eventHint = useMemo(() => {
    if (loadingEvents) return "イベントを読み込み中です";
    if (events.length === 0) return "先にイベントを掲載すると、対象を選べます";
    return null;
  }, [loadingEvents, events.length]);

  function addTag() {
    const next = tagDraft.trim().replace(/^#/, "");
    if (!next || tags.includes(next) || tags.length >= 8) return;
    setTags((current) => [...current, next]);
    setTagDraft("");
  }

  function addSpot() {
    const next = createPhotoSpot();
    setSpots((current) => [...current, next]);
    setEditingKey(next.key);
  }

  function updateSpot(key: string, patch: Partial<PhotoSpot>) {
    setSpots((current) => current.map((spot) => (spot.key === key ? { ...spot, ...patch } : spot)));
  }

  function validateStep(id: StepId): string | null {
    if (id === "basic" && !name.trim()) return "タイトルを入力してください";
    if (id === "spots" && spots.every((spot) => !spot.name.trim())) return "撮影スポットを1つ以上追加してください";
    return null;
  }

  function goNext() {
    const message = validateStep(step);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    const next = STEPS[Math.min(stepIndex + 1, STEPS.length - 1)];
    setStep(next.id);
    if (next.id === "spots") setPreviewTab("spots");
    if (next.id === "rules" || next.id === "publish") setPreviewTab("rewards");
    if (next.id === "basic" || next.id === "design") setPreviewTab("cover");
  }

  async function save(status: "draft" | "published") {
    const message = validateStep("basic") ?? (status === "published" ? validateStep("spots") : null);
    if (message) {
      setError(message);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/organizer/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type: "photo",
          eventId: eventId || null,
          description: description.trim(),
          startsAt: toIsoFromDateTime(startDate, startTime),
          endsAt: toIsoFromDateTime(endDate, endTime),
          status,
          spots: spots
            .filter((spot) => spot.name.trim())
            .map((spot) => ({ name: spot.name.trim(), kind: "stamp" })),
          photo: {
            spots: spots.map(({ name: spotName, place, prompt, imageUrl }) => ({
              name: spotName,
              place,
              prompt,
              imageUrl,
            })),
            clearCount,
            photoRequired,
            rewards: { points: pointsOn, coupon: couponOn, prize: prizeOn },
            points,
            category,
            tags,
            mainImage,
            coverImage: coverImage || mainImage,
            themeColor,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "作成に失敗しました");
        return;
      }
      if (status === "published") {
        setPublished(true);
        return;
      }
      router.push("/organizer/games");
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  if (published) {
    return (
      <div className="org-photo">
        <GamePublishSuccess typeLabel="フォトラリー" />
      </div>
    );
  }

  return (
    <div className="org-photo">
      <Link href="/organizer/games" className="org-photo__back">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        ゲーム機能に戻る
      </Link>

      <header className="org-photo__hero">
        <div className="org-photo__hero-copy">
          <h1>フォトラリーを作成する</h1>
          <p>スポットで写真を撮って、思い出を集めるゲームです。かんたんに作成できます。</p>
        </div>
        <div className="org-photo__hero-aside">
          <Image src="/organizer/games/game-type-photo.png" alt="" width={120} height={120} unoptimized />
          <ul>
            <li>
              <Check className="h-3.5 w-3.5" aria-hidden />
              写真を撮るだけで楽しめる！
            </li>
            <li>
              <Check className="h-3.5 w-3.5" aria-hidden />
              観光スポットやお店の回遊におすすめ
            </li>
            <li>
              <Check className="h-3.5 w-3.5" aria-hidden />
              SNSでのシェアも促進できます
            </li>
          </ul>
        </div>
      </header>

      <ol className="org-photo__steps" aria-label="作成の手順">
        {STEPS.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              className={cn(step === item.id && "is-on", index < stepIndex && "is-done")}
              onClick={() => setStep(item.id)}
            >
              <em>{index + 1}</em>
              {item.label}
            </button>
          </li>
        ))}
      </ol>

      <div className="org-photo__layout">
        <div className="org-photo__main">
          {step === "basic" ? (
            <section className="org-photo__card">
              <h2>
                <span>1</span>
                基本設定
              </h2>
              <p>まずはフォトラリーの基本情報を設定しましょう。</p>
              <div className="org-photo__grid">
                <label className="org-photo__field org-photo__field--wide">
                  <span>
                    タイトル <em>必須</em>
                  </span>
                  <input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} required />
                  <small>{name.length}/50</small>
                </label>
                <label className="org-photo__field org-photo__field--wide">
                  <span>
                    説明文 <em>必須</em>
                  </span>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} rows={3} />
                  <small>{description.length}/200</small>
                </label>
                <div className="org-photo__field">
                  <span>
                    メイン画像 <em>必須</em>
                  </span>
                  <div className="org-photo__main-image">
                    <Image src={mainImage} alt="" width={640} height={360} unoptimized />
                    <span>
                      <ImagePlus className="h-3.5 w-3.5" aria-hidden />
                      画像を変更
                    </span>
                  </div>
                  <ul className="org-photo__thumbs">
                    {PHOTO_SAMPLE_IMAGES.map((src) => (
                      <li key={src}>
                        <button
                          type="button"
                          className={cn(mainImage === src && "is-on")}
                          onClick={() => {
                            setMainImage(src);
                            setCoverImage(src);
                          }}
                        >
                          <Image src={src} alt="" width={80} height={56} unoptimized />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="org-photo__field">
                  <span>開催期間</span>
                  <div className="org-photo__when">
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                    <span>〜</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                  </div>
                </div>
                <label className="org-photo__field">
                  <span>対象イベント</span>
                  <select value={eventId} onChange={(e) => setEventId(e.target.value)} disabled={loadingEvents}>
                    <option value="">あとで選ぶ</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title}
                        {event.date ? `（${event.date}）` : ""}
                      </option>
                    ))}
                  </select>
                  {eventHint ? <small>{eventHint}</small> : null}
                </label>
                <label className="org-photo__field">
                  <span>カテゴリ</span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as (typeof PHOTO_CATEGORIES)[number])}
                  >
                    {PHOTO_CATEGORIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="org-photo__field org-photo__field--wide">
                  <span>タグ（任意）</span>
                  <div className="org-photo__tags">
                    {tags.map((tag) => (
                      <button key={tag} type="button" onClick={() => setTags((current) => current.filter((item) => item !== tag))}>
                        #{tag} ×
                      </button>
                    ))}
                    <input
                      value={tagDraft}
                      onChange={(e) => setTagDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      placeholder="タグを追加（Enterで追加）"
                    />
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {step === "spots" ? (
            <section className="org-photo__card">
              <div className="org-photo__card-head">
                <div>
                  <h2>
                    <span>2</span>
                    スポット設定
                  </h2>
                  <p>「中央広場で桜を撮る」などの撮影スポットを追加します。</p>
                </div>
                <button type="button" className="org-photo__add" onClick={addSpot}>
                  <Plus className="h-4 w-4" aria-hidden />
                  スポットを追加
                </button>
              </div>
              {spots.length === 0 ? (
                <p className="org-photo__empty">まだスポットがありません。撮影場所とお題を追加しましょう。</p>
              ) : (
                <ul className="org-photo__spots">
                  {spots.map((spot, index) => (
                    <li key={spot.key}>
                      <em>{index + 1}</em>
                      <div>
                        <strong>{spot.name.trim() || "撮影スポット"}</strong>
                        <span>
                          <MapPin className="h-3 w-3" aria-hidden />
                          {spot.place.trim() || "場所未設定"}
                        </span>
                      </div>
                      <button type="button" onClick={() => setEditingKey(spot.key === editingKey ? null : spot.key)}>
                        {spot.key === editingKey ? "閉じる" : "編集"}
                      </button>
                      <button type="button" onClick={() => setSpots((current) => current.filter((item) => item.key !== spot.key))}>
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {editing ? (
                <div className="org-photo__editor">
                  <label>
                    お題・スポット名
                    <input
                      value={editing.name}
                      onChange={(e) => updateSpot(editing.key, { name: e.target.value })}
                      placeholder="中央広場で桜を撮る"
                    />
                  </label>
                  <label>
                    場所
                    <input
                      value={editing.place}
                      onChange={(e) => updateSpot(editing.key, { place: e.target.value })}
                      placeholder="中央広場"
                    />
                  </label>
                  <label>
                    撮影のヒント
                    <input
                      value={editing.prompt}
                      onChange={(e) => updateSpot(editing.key, { prompt: e.target.value })}
                      placeholder="満開の桜と一緒に記念写真を"
                    />
                  </label>
                  <div>
                    <span>参考画像</span>
                    <ul className="org-photo__thumbs">
                      {PHOTO_SAMPLE_IMAGES.map((src) => (
                        <li key={src}>
                          <button
                            type="button"
                            className={cn(editing.imageUrl === src && "is-on")}
                            onClick={() => updateSpot(editing.key, { imageUrl: src })}
                          >
                            <Image src={src} alt="" width={80} height={56} unoptimized />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {step === "rules" ? (
            <section className="org-photo__card">
              <h2>
                <span>3</span>
                ルール設定
              </h2>
              <p>何個達成でクリアか、写真投稿や特典を決めます。</p>
              <label className="org-photo__field">
                <span>クリアに必要なスポット数</span>
                <select value={clearCount} onChange={(e) => setClearCount(Number(e.target.value))}>
                  {Array.from({ length: Math.max(spots.length, 1) }, (_, index) => index + 1).map((count) => (
                    <option key={count} value={count}>
                      {count} スポット
                    </option>
                  ))}
                </select>
              </label>
              <label className="org-photo__check">
                <input type="checkbox" checked={photoRequired} onChange={(e) => setPhotoRequired(e.target.checked)} />
                写真投稿を必須にする
              </label>
              <p className="org-photo__sub">クリア特典</p>
              <ul className="org-photo__toggles">
                <li>
                  <label className="org-photo__check">
                    <input type="checkbox" checked={pointsOn} onChange={(e) => setPointsOn(e.target.checked)} />
                    ポイント
                  </label>
                  {pointsOn ? (
                    <input
                      type="number"
                      min={1}
                      max={9999}
                      value={points}
                      onChange={(e) => setPoints(Number(e.target.value) || 0)}
                    />
                  ) : null}
                </li>
                <li>
                  <label className="org-photo__check">
                    <input type="checkbox" checked={couponOn} onChange={(e) => setCouponOn(e.target.checked)} />
                    クーポン
                  </label>
                </li>
                <li>
                  <label className="org-photo__check">
                    <input type="checkbox" checked={prizeOn} onChange={(e) => setPrizeOn(e.target.checked)} />
                    景品・記念品
                  </label>
                </li>
              </ul>
            </section>
          ) : null}

          {step === "design" ? (
            <section className="org-photo__card">
              <h2>
                <span>4</span>
                デザイン設定
              </h2>
              <p>カバー画像とテーマカラーで、参加画面の印象を整えられます。</p>
              <div className="org-photo__field">
                <span>カバー画像</span>
                <ul className="org-photo__thumbs">
                  {PHOTO_SAMPLE_IMAGES.map((src) => (
                    <li key={src}>
                      <button type="button" className={cn(coverImage === src && "is-on")} onClick={() => setCoverImage(src)}>
                        <Image src={src} alt="" width={80} height={56} unoptimized />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="org-photo__field">
                <span>テーマカラー</span>
                <ul className="org-photo__colors">
                  {PHOTO_THEME_COLORS.map((color) => (
                    <li key={color.id}>
                      <button
                        type="button"
                        className={cn(themeColor === color.value && "is-on")}
                        style={{ background: color.value }}
                        onClick={() => setThemeColor(color.value)}
                        aria-label={color.label}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}

          {step === "publish" ? (
            <section className="org-photo__card">
              <h2>
                <span>5</span>
                確認・公開
              </h2>
              <p>右のスマホプレビューを見て、問題なければ公開できます。下書き保存もできます。</p>
              <dl className="org-photo__summary">
                <div>
                  <dt>タイトル</dt>
                  <dd>{name.trim() || "未入力"}</dd>
                </div>
                <div>
                  <dt>期間</dt>
                  <dd>{periodLabel ?? "未設定"}</dd>
                </div>
                <div>
                  <dt>スポット</dt>
                  <dd>{spots.filter((spot) => spot.name.trim()).length} 箇所</dd>
                </div>
                <div>
                  <dt>クリア条件</dt>
                  <dd>
                    {clearCount} スポット達成
                    {photoRequired ? "・写真必須" : ""}
                  </dd>
                </div>
              </dl>
            </section>
          ) : null}

          {error ? <p className="org-photo__error">{error}</p> : null}

          <div className="org-photo__footer">
            <button type="button" className="org-photo__ghost" disabled={saving} onClick={() => void save("draft")}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              下書き保存
            </button>
            {stepIndex < STEPS.length - 1 ? (
              <button type="button" className="org-photo__next" onClick={goNext}>
                保存して次へ
              </button>
            ) : (
              <button type="button" className="org-photo__next" disabled={saving} onClick={() => void save("published")}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Share2 className="h-4 w-4" aria-hidden />}
                公開する
              </button>
            )}
          </div>
        </div>

        <OrganizerPhotoPreview
          name={name}
          description={description}
          periodLabel={periodLabel}
          category={category}
          tags={tags}
          coverImage={coverImage || mainImage}
          themeColor={themeColor}
          spots={spots}
          clearCount={clearCount}
          photoRequired={photoRequired}
          points={points}
          rewards={{ points: pointsOn, coupon: couponOn, prize: prizeOn }}
          tab={previewTab}
          onTab={setPreviewTab}
        />
      </div>
    </div>
  );
}
