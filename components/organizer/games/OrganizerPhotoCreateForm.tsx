"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Coins,
  Copy,
  Gift,
  Trophy,
  MapPin,
  Plus,
  Trash2,
  PenLine,
  ListChecks,
  Rocket,
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
import { PhotoTestPlay } from "@/components/organizer/games/PhotoTestPlay";
import { GamePhonePreview } from "@/components/organizer/games/GamePhonePreview";
import { ImageUploadTile } from "@/components/organizer/games/GameImageField";
import { RewardFields } from "@/components/organizer/games/RewardFields";
import { ClearCountCard, RewardCard, RewardList } from "@/components/organizer/games/RewardOptions";
import { PeriodPresets, jstDate, periodProblem } from "@/components/organizer/games/PeriodPresets";
import { useGameLookEdit } from "@/components/organizer/games/useGameLookEdit";
import { GameCreateShell, type GameCreateStep } from "@/components/organizer/games/GameCreateShell";
import { GamePublishSuccess } from "@/components/organizer/games/GamePublishSuccess";

const STEPS = [
  { id: "basic", label: "基本設定" },
  { id: "spots", label: "スポット設定" },
  { id: "rules", label: "ルール設定" },
  { id: "publish", label: "公開設定" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const SHELL_STEPS: GameCreateStep[] = [
  { label: STEPS[0].label, icon: PenLine },
  { label: STEPS[1].label, icon: MapPin },
  { label: STEPS[2].label, icon: ListChecks },
  { label: STEPS[3].label, icon: Rocket },
];

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

/** スポットの編集欄の入力欄（枠が見えるように直接指定する）。 */
const SPOT_INPUT = {
  width: "100%",
  minHeight: "2.6rem",
  padding: "0 0.75rem",
  border: "1.5px solid #dfe7e1",
  borderRadius: "0.7rem",
  background: "#fbfdfb",
  fontSize: "0.9rem",
  fontWeight: 500,
  color: "#1a2214",
} as const;
const SPOT_LABEL = { display: "grid", gap: "0.25rem", fontSize: "0.78rem", fontWeight: 800, color: "#3c4a40" } as const;

export function OrganizerPhotoCreateForm() {
  const { look, lookEdit } = useGameLookEdit();
  const router = useRouter();
  const [step, setStep] = useState<StepId>("basic");
  const [name, setName] = useState("春のまち歩きフォトラリー");
  const [description, setDescription] = useState("まちのスポットを巡って写真を撮りながら地域の魅力を見つけよう！");
  const [eventId, setEventId] = useState("");
  // はじめは今日から1か月（過去の日付から始めない）。
  const [startDate, setStartDate] = useState(() => jstDate());
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState(() => jstDate(29));
  const [endTime, setEndTime] = useState("18:00");
  const [events, setEvents] = useState<OrganizerGameEventOption[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [mainImage, setMainImage] = useState<string>(PHOTO_SAMPLE_IMAGES[1]);
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
  const [couponName, setCouponName] = useState("");
  const [couponDetail, setCouponDetail] = useState("");
  const [prizeName, setPrizeName] = useState("");
  const [prizePlace, setPrizePlace] = useState("");
  const [points, setPoints] = useState(50);
  const [coverImage, setCoverImage] = useState<string>(PHOTO_SAMPLE_IMAGES[1]);
  // テーマカラーは参加者の画面では使っていない（背景はプレビューの見た目で決める）。保存の形は変えずに残す。
  const themeColor: (typeof PHOTO_THEME_COLORS)[number]["value"] = PHOTO_THEME_COLORS[0].value;
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
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

  function moveSpot(key: string, delta: number) {
    setSpots((current) => {
      const index = current.findIndex((spot) => spot.key === key);
      const to = index + delta;
      if (index < 0 || to < 0 || to >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(to, 0, item!);
      return next;
    });
  }

  function duplicateSpot(key: string) {
    setSpots((current) => {
      const index = current.findIndex((spot) => spot.key === key);
      if (index < 0) return current;
      const copy = { ...current[index]!, key: crypto.randomUUID() };
      const next = [...current];
      next.splice(index + 1, 0, copy);
      setEditingKey(copy.key);
      return next;
    });
  }

  function updateSpot(key: string, patch: Partial<PhotoSpot>) {
    setSpots((current) => current.map((spot) => (spot.key === key ? { ...spot, ...patch } : spot)));
  }

  function validateStep(id: StepId): string | null {
    if (id === "basic" && !name.trim()) return "タイトルを入力してください";
    if (id === "basic") {
      const problem = periodProblem(startDate, endDate);
      if (problem) return problem;
    }
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
    goTo(STEPS[Math.min(stepIndex + 1, STEPS.length - 1)].id);
  }

  function goTo(id: StepId) {
    setStep(id);
  }

  /** 保存で送る設定。プレビューも同じものから描く。 */
  const settingsBody = {
    spots: spots.map(({ name: spotName, place, prompt, imageUrl }) => ({
      name: spotName,
      place,
      prompt,
      imageUrl,
    })),
    clearCount,
    photoRequired,
    rewards: { points: pointsOn, coupon: couponOn, prize: prizeOn, couponName, couponDetail, prizeName, prizePlace },
    points,
    category,
    tags,
    mainImage,
    coverImage: coverImage || mainImage,
    themeColor,
  };

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
          photo: settingsBody,
          look,
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
    <GameCreateShell
      title="フォトラリー作成"
      subtitle="スポットで写真を撮って、思い出を集めるゲームです。かんたんに作成できます。"
      steps={SHELL_STEPS}
      step={stepIndex}
      onStep={(index) => {
        setError(null);
        goTo(STEPS[index].id);
      }}
      onNext={goNext}
      saving={saving}
      error={error}
      onTry={() => setTesting(true)}
      onDraft={() => void save("draft")}
      onPublish={() => void save("published")}
      preview={
        <GamePhonePreview
          kind="photo"
          typeLabel="フォトラリー"
          name={name}
          description={description}
          settings={settingsBody}
          look={lookEdit}
          stepView={stepIndex === 0 ? "start" : stepIndex === STEPS.length - 1 ? "clear" : "play"}
        />
      }
    >
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
                  {/* 大きく出しすぎないよう、見本と横に並べる。 */}
                  <div style={{ display: "flex", gap: "0.7rem", alignItems: "flex-start" }}>
                  <div className="org-photo__main-image" style={{ flex: "none", width: "min(42%, 11rem)", height: "auto", aspectRatio: "4 / 3" }}>
                    <Image src={mainImage} alt="" width={640} height={480} unoptimized />
                  </div>
                  <ul className="org-photo__thumbs" style={{ flex: 1, minWidth: 0, margin: 0 }}>
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
                    {/* 見本にない写真は、ここから自分でアップロードする。 */}
                    <li>
                      <ImageUploadTile
                        onUploaded={(url) => {
                          setMainImage(url);
                          setCoverImage(url);
                        }}
                      />
                    </li>
                    {!(PHOTO_SAMPLE_IMAGES as readonly string[]).includes(mainImage) ? (
                      <li style={{ alignSelf: "center", fontSize: "0.7rem", fontWeight: 800, color: "#1f7a4a" }}>自分の写真を使用中</li>
                    ) : null}
                  </ul>
                  </div>
                </div>
                <div className="org-photo__field">
                  <span>開催期間</span>
                  {/* 日付と時刻を1行に。開始の行・終了の行の2行にして、縦に長くしない。 */}
                  <div className="org-photo__when" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 6.5rem", gap: "0.35rem 0.4rem", alignItems: "center" }}>
                    <input type="date" aria-label="開始日" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    <input type="time" aria-label="開始時刻" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                    <span style={{ gridColumn: "1 / -1", textAlign: "center", lineHeight: 1, color: "#8a968e" }}>〜</span>
                    <input
                      type="date"
                      aria-label="終了日"
                      value={endDate}
                      min={startDate || undefined}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                    <input type="time" aria-label="終了時刻" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                  </div>
                  <PeriodPresets startDate={startDate} endDate={endDate} onStart={setStartDate} onEnd={setEndDate} />
                </div>
                <label className="org-photo__field">
                  <span>対象イベント（任意）</span>
                  <select
                    value={eventId}
                    disabled={loadingEvents}
                    onChange={(e) => {
                      setEventId(e.target.value);
                      // イベントの日があれば、開催期間をその日に合わせる（あとで変えられる）。
                      const day = events.find((event) => event.id === e.target.value)?.date?.slice(0, 10);
                      if (day && /^\d{4}-\d{2}-\d{2}$/.test(day)) {
                        setStartDate(day);
                        setEndDate(day);
                      }
                    }}
                  >
                    <option value="">あとで選ぶ</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title}
                        {event.date ? `（${event.date}）` : ""}
                      </option>
                    ))}
                  </select>
                  <small>{eventHint ?? "選ぶと、イベントのページからこのゲームに入れます。開催期間もイベントの日に合わせます。"}</small>
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
                <ol style={{ display: "grid", gap: "0.6rem", margin: "0.8rem 0 0", padding: 0, listStyle: "none" }}>
                  {spots.map((spot, index) => {
                    const open = spot.key === editingKey;
                    const todo = !spot.name.trim() ? "お題が未入力" : !spot.place.trim() ? "場所が未入力" : null;
                    return (
                      <li
                        key={spot.key}
                        style={{ border: `1.5px solid ${open ? "#9fd3b2" : "#ece4dc"}`, borderRadius: "1rem", background: "#fff", overflow: "hidden" }}
                      >
                        <button
                          type="button"
                          aria-expanded={open}
                          onClick={() => setEditingKey(open ? null : spot.key)}
                          style={{ display: "flex", alignItems: "center", gap: "0.7rem", width: "100%", padding: "0.7rem 0.8rem", border: 0, background: "none", textAlign: "left", cursor: "pointer" }}
                        >
                          <span
                            aria-hidden
                            style={{ display: "inline-flex", flex: "none", alignItems: "center", justifyContent: "center", width: "1.7rem", height: "1.7rem", borderRadius: "50%", background: "#e7f4ec", color: "#1f7a4a", fontWeight: 900, fontSize: "0.8rem" }}
                          >
                            {index + 1}
                          </span>
                          {spot.imageUrl ? (
                            <Image
                              src={spot.imageUrl}
                              alt=""
                              width={96}
                              height={72}
                              unoptimized
                              style={{ flex: "none", width: "3.6rem", height: "2.7rem", objectFit: "cover", borderRadius: "0.5rem" }}
                            />
                          ) : null}
                          <span style={{ display: "grid", gap: "0.2rem", flex: 1, minWidth: 0 }}>
                            <b style={{ fontSize: "0.92rem", color: "#1a2214" }}>{spot.name.trim() || "お題を入れてください"}</b>
                            <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.3rem", fontSize: "0.74rem", color: "#6a7568" }}>
                              <MapPin className="h-3 w-3" aria-hidden />
                              {spot.place.trim() || "場所未設定"}
                              {todo ? (
                                <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#b45309", background: "#fff4dc", borderRadius: 999, padding: "0.05rem 0.45rem" }}>
                                  {todo}
                                </span>
                              ) : null}
                            </span>
                          </span>
                          <span style={{ flex: "none", fontSize: "0.75rem", fontWeight: 800, color: "#1f7a4a" }}>{open ? "閉じる" : "編集"}</span>
                        </button>
                        {open ? (
                          <div style={{ display: "grid", gap: "0.65rem", padding: "0.8rem 0.85rem 0.85rem", borderTop: "1px dashed #d8e6dc", background: "#fcfdfc" }}>
                            <label style={SPOT_LABEL}>
                              お題
                              <input
                                value={spot.name}
                                maxLength={40}
                                onChange={(e) => updateSpot(spot.key, { name: e.target.value })}
                                placeholder="例：中央広場で桜を撮る"
                                style={SPOT_INPUT}
                              />
                            </label>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(9rem, 1fr))", gap: "0.5rem" }}>
                              <label style={SPOT_LABEL}>
                                場所
                                <input
                                  value={spot.place}
                                  maxLength={40}
                                  onChange={(e) => updateSpot(spot.key, { place: e.target.value })}
                                  placeholder="例：中央広場"
                                style={SPOT_INPUT}
                                />
                              </label>
                              <label style={SPOT_LABEL}>
                                撮影のヒント
                                <input
                                  value={spot.prompt}
                                  maxLength={80}
                                  onChange={(e) => updateSpot(spot.key, { prompt: e.target.value })}
                                  placeholder="例：満開の桜と一緒に記念写真を"
                                style={SPOT_INPUT}
                                />
                              </label>
                            </div>
                            <div style={{ display: "grid", gap: "0.25rem" }}>
                              <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#3c4a40" }}>参考画像（参加者に見せる見本）</span>
                              <ul className="org-photo__thumbs">
                                {PHOTO_SAMPLE_IMAGES.map((src) => (
                                  <li key={src}>
                                    <button
                                      type="button"
                                      className={cn(spot.imageUrl === src && "is-on")}
                                      onClick={() => updateSpot(spot.key, { imageUrl: src })}
                                    >
                                      <Image src={src} alt="" width={80} height={56} unoptimized />
                                    </button>
                                  </li>
                                ))}
                                <li>
                                  <ImageUploadTile onUploaded={(url) => updateSpot(spot.key, { imageUrl: url })} />
                                </li>
                              </ul>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", paddingTop: "0.2rem" }}>
                              {[
                                { label: "上へ", icon: ChevronUp, onClick: () => moveSpot(spot.key, -1), disabled: index === 0 },
                                { label: "下へ", icon: ChevronDown, onClick: () => moveSpot(spot.key, 1), disabled: index === spots.length - 1 },
                                { label: "複製", icon: Copy, onClick: () => duplicateSpot(spot.key) },
                                {
                                  label: "削除",
                                  icon: Trash2,
                                  onClick: () => {
                                    setSpots((current) => current.filter((item) => item.key !== spot.key));
                                    setEditingKey(null);
                                  },
                                },
                              ].map((tool) => (
                                <button
                                  key={tool.label}
                                  type="button"
                                  disabled={tool.disabled}
                                  onClick={tool.onClick}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.2rem",
                                    minHeight: "1.9rem",
                                    padding: "0 0.6rem",
                                    border: "1px solid #e2ebe5",
                                    borderRadius: 999,
                                    background: "#fff",
                                    color: tool.label === "削除" ? "#c0392b" : "#3c4a40",
                                    fontSize: "0.72rem",
                                    fontWeight: 700,
                                    opacity: tool.disabled ? 0.4 : 1,
                                    cursor: tool.disabled ? "default" : "pointer",
                                  }}
                                >
                                  <tool.icon className="h-3.5 w-3.5" aria-hidden />
                                  {tool.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
              )}
              <button type="button" className="org-photo__add" style={{ marginTop: "0.7rem" }} onClick={addSpot}>
                <Plus className="h-4 w-4" aria-hidden />
                スポットを追加
              </button>
            </section>
          ) : null}

          {step === "rules" ? (
            <section className="org-photo__card">
              <h2>
                <span>3</span>
                ルール設定
              </h2>
              <p>何個達成でクリアか、写真投稿や特典を決めます。</p>
              <RewardList>
                <ClearCountCard
                  icon={Trophy}
                  title={`${Math.min(clearCount, Math.max(spots.length, 1))}スポットでクリア`}
                  desc="スポットの数までの中から選べます"
                  value={Math.min(clearCount, Math.max(spots.length, 1))}
                  max={spots.length}
                  unit="スポット"
                  onChange={setClearCount}
                />
                <RewardCard
                  icon={Camera}
                  title="写真の投稿を求める"
                  desc={photoRequired ? "参加者のボタンが「写真を残す」になります" : "参加者のボタンが「ここに来た」になります"}
                  on={photoRequired}
                  onChange={setPhotoRequired}
                />
                <p style={{ margin: "0.6rem 0 0", fontSize: "0.78rem", fontWeight: 800, color: "#3c4a40" }}>クリアした人への特典</p>
                <RewardCard
                  icon={Coins}
                  title="ポイント"
                  desc="クリアした人のアカウントに、ポイントを加えます"
                  on={pointsOn}
                  onChange={setPointsOn}
                >
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78rem", fontWeight: 800, color: "#3c4a40" }}>
                    もらえるポイント
                    <input
                      type="number"
                      min={1}
                      max={9999}
                      value={points}
                      onChange={(e) => setPoints(Number(e.target.value) || 0)}
                      style={{ width: "5.5rem", minHeight: "2.1rem", padding: "0 0.6rem", border: "1.5px solid #dfe7e1", borderRadius: "0.6rem", background: "#fff", fontSize: "0.9rem" }}
                    />
                    pt
                  </label>
                </RewardCard>
                <RewardCard
                  icon={Gift}
                  title="クーポン"
                  desc="クリアした人に、1人ずつ違うコードのクーポンを出します"
                  on={couponOn}
                  onChange={setCouponOn}
                >
                  <RewardFields
                    fields={[
                      { label: "クーポンの名前", value: couponName, onChange: setCouponName, max: 40, placeholder: "例：コーヒー1杯無料" },
                      { label: "内容・使い方", value: couponDetail, onChange: setCouponDetail, max: 80, placeholder: "例：参加店でお会計のときに見せてください" },
                    ]}
                    note="使ったかどうかは、ゲームの管理画面で記録できます。"
                  />
                </RewardCard>
                <RewardCard
                  icon={Gift}
                  title="景品・記念品"
                  desc="クリアした人が、現地で景品と引き換えられます"
                  on={prizeOn}
                  onChange={setPrizeOn}
                >
                  <RewardFields
                    fields={[
                      { label: "景品の名前", value: prizeName, onChange: setPrizeName, max: 40, placeholder: "例：オリジナル手ぬぐい" },
                      { label: "受け取り場所", value: prizePlace, onChange: setPrizePlace, max: 60, placeholder: "例：駅前の観光案内所" },
                    ]}
                    note="引き換えコードを出します。渡したら、管理画面で引き換え済みにできます。"
                  />
                </RewardCard>
              </RewardList>
            </section>
          ) : null}

          {step === "publish" ? (
            <section className="org-photo__card">
              <h2>
                <span>4</span>
                確認・公開
              </h2>
              <p>内容を確かめて、問題なければ「公開する」を押してください。直したいところは「変更」から戻れます。</p>
              {(() => {
                const named = spots.filter((spot) => spot.name.trim());
                const todos = [
                  !name.trim() ? { text: "タイトルが未入力です", to: "basic" as StepId } : null,
                  periodProblem(startDate, endDate) ? { text: periodProblem(startDate, endDate)!, to: "basic" as StepId } : null,
                  named.length === 0 ? { text: "撮影スポットがありません", to: "spots" as StepId } : null,
                  spots.some((spot) => spot.name.trim() && !spot.place.trim())
                    ? { text: "場所が未入力のスポットがあります", to: "spots" as StepId }
                    : null,
                  couponOn && !couponName.trim() ? { text: "クーポンの名前が未入力です（空でも公開できます）", to: "rules" as StepId } : null,
                  prizeOn && !prizeName.trim() ? { text: "景品の名前が未入力です（空でも公開できます）", to: "rules" as StepId } : null,
                ].filter((item): item is { text: string; to: StepId } => item != null);
                const rewardText =
                  [pointsOn ? `${points}pt` : "", couponOn ? `クーポン${couponName.trim() ? `「${couponName.trim()}」` : ""}` : "", prizeOn ? `景品${prizeName.trim() ? `「${prizeName.trim()}」` : ""}` : ""]
                    .filter(Boolean)
                    .join("・") || "なし";
                const rows: { label: string; value: string; to: StepId }[] = [
                  { label: "タイトル", value: name.trim() || "未入力", to: "basic" },
                  { label: "期間", value: periodLabel ?? "未設定", to: "basic" },
                  { label: "スポット", value: `${named.length}か所`, to: "spots" },
                  {
                    label: "クリア条件",
                    value: `${Math.min(clearCount, Math.max(named.length, 1))}スポット${photoRequired ? "・写真あり" : ""}`,
                    to: "rules",
                  },
                  { label: "特典", value: rewardText, to: "rules" },
                ];
                return (
                  <>
                    {todos.length > 0 ? (
                      <ul
                        style={{
                          display: "grid",
                          gap: "0.3rem",
                          margin: "0.7rem 0 0",
                          padding: "0.6rem 0.75rem",
                          listStyle: "none",
                          borderRadius: "0.8rem",
                          background: "#fff6e6",
                          border: "1px solid #f3d9a4",
                        }}
                      >
                        {todos.map((todo) => (
                          <li key={todo.text} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", fontSize: "0.78rem", color: "#8a5a00", fontWeight: 700 }}>
                            <span>・{todo.text}</span>
                            <button
                              type="button"
                              onClick={() => goTo(todo.to)}
                              style={{ flex: "none", border: 0, background: "none", color: "#1f7a4a", fontSize: "0.75rem", fontWeight: 800, textDecoration: "underline", cursor: "pointer" }}
                            >
                              直す
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ margin: "0.7rem 0 0", padding: "0.55rem 0.75rem", borderRadius: "0.8rem", background: "#eef7f1", color: "#1f7a4a", fontSize: "0.8rem", fontWeight: 800 }}>
                        ✓ 公開できます
                      </p>
                    )}
                    <dl style={{ display: "grid", margin: "0.7rem 0 0", border: "1px solid #ece4dc", borderRadius: "0.9rem", overflow: "hidden" }}>
                      {rows.map((row, index) => (
                        <div
                          key={row.label}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "5.5rem minmax(0, 1fr) auto",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.6rem 0.75rem",
                            borderTop: index === 0 ? 0 : "1px solid #f1ebe5",
                            background: "#fff",
                          }}
                        >
                          <dt style={{ fontSize: "0.74rem", fontWeight: 800, color: "#6a7568" }}>{row.label}</dt>
                          <dd style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700, color: "#1a2214", overflowWrap: "anywhere" }}>{row.value}</dd>
                          <button
                            type="button"
                            onClick={() => goTo(row.to)}
                            style={{ border: 0, background: "none", color: "#1f7a4a", fontSize: "0.74rem", fontWeight: 800, cursor: "pointer" }}
                          >
                            変更
                          </button>
                        </div>
                      ))}
                    </dl>
                    <p style={{ margin: "0.7rem 0 0", fontSize: "0.74rem", color: "#6a7568", lineHeight: 1.6 }}>
                      見た目（背景・アイコン・文字）は、プレビューの「アイコン」「挿入」「背景」で変えられます。
                    </p>
                  </>
                );
              })()}
            </section>
          ) : null}
      {testing ? (
        <PhotoTestPlay
          name={name}
          description={description}
          spots={spots}
          clearCount={clearCount}
          photoRequired={photoRequired}
          points={points}
          rewards={{ points: pointsOn, coupon: couponOn, prize: prizeOn }}
          onClose={() => setTesting(false)}
        />
      ) : null}
    </GameCreateShell>
  );
}
