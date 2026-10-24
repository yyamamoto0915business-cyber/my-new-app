"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Minus,
  Pencil,
  Plus,
  Trash2,
  PenLine,
  Store,
  ListChecks,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { OrganizerGameEventOption } from "@/lib/organizer/games";
import {
  COUPON_CATEGORIES,
  COUPON_SAMPLE_IMAGES,
  COUPON_WIN_MODES,
  createCouponStore,
  sampleCouponStores,
  type CouponAudience,
  type CouponCategory,
  type CouponStore,
  type CouponWinMode,
} from "@/lib/organizer/coupon";
import { CouponTestPlay } from "@/components/organizer/games/CouponTestPlay";
import { GamePhonePreview } from "@/components/organizer/games/GamePhonePreview";
import { AudienceField, type GameAudienceChoice } from "@/components/organizer/games/AudienceField";
import { ImageUploadTile } from "@/components/organizer/games/GameImageField";
import { PeriodPresets, jstDate, periodProblem } from "@/components/organizer/games/PeriodPresets";
import { useGameLookEdit } from "@/components/organizer/games/useGameLookEdit";
import { GameCreateShell, type GameCreateStep } from "@/components/organizer/games/GameCreateShell";
import { GamePublishSuccess } from "@/components/organizer/games/GamePublishSuccess";
import "./coupon-create.css";

const STEPS = [
  { id: "basic", label: "基本設定" },
  { id: "stores", label: "店舗・クーポン" },
  { id: "rules", label: "取得・利用条件" },
  { id: "publish", label: "確認・公開" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const SHELL_STEPS: GameCreateStep[] = [
  { label: STEPS[0].label, icon: PenLine },
  { label: STEPS[1].label, icon: Store },
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

export function OrganizerCouponCreateForm() {
  const { look, lookEdit } = useGameLookEdit();
  const router = useRouter();
  const [step, setStep] = useState<StepId>("basic");
  const [name, setName] = useState("まちなかグルメクーポンラリー");
  const [description, setDescription] = useState(
    "まちなかの対象店舗をめぐってクーポンを集めよう！グルメ・ショッピング・体験など、さまざまなお店で使えるお得なクーポンがもらえます。"
  );
  const [eventId, setEventId] = useState("");
  const [startDate, setStartDate] = useState(() => jstDate());
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState(() => jstDate(29));
  const [endTime, setEndTime] = useState("18:00");
  const [events, setEvents] = useState<OrganizerGameEventOption[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [mainImage, setMainImage] = useState<string>(COUPON_SAMPLE_IMAGES[1]);
  const [category, setCategory] = useState<CouponCategory>("グルメ");
  const [tags, setTags] = useState<string[]>(["グルメ", "食べ歩き", "春のまつり"]);
  const [tagDraft, setTagDraft] = useState("");
  const [stores, setStores] = useState<CouponStore[]>(() => sampleCouponStores());
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [winMode, setWinMode] = useState<CouponWinMode>("spots");
  const [winCount, setWinCount] = useState(2);
  const [oncePerPerson, setOncePerPerson] = useState(true);
  const [noStack, setNoStack] = useState(true);
  const [useStart, setUseStart] = useState(() => jstDate());
  const [useEnd, setUseEnd] = useState(() => jstDate(29));
  const [timeLimit, setTimeLimit] = useState(false);
  const [useFrom, setUseFrom] = useState("09:00");
  const [useTo, setUseTo] = useState("18:00");
  const [maxCount, setMaxCount] = useState(500);
  const [firstCome, setFirstCome] = useState(true);
  const [autoGrant, setAutoGrant] = useState(true);
  // クーポン独自の参加対象（buyers / category）は使わず、いつも anyone。絞り込みは playAudience（全ゲーム共通）で行う。
  const [audience] = useState<CouponAudience>("anyone");
  const [playAudience, setPlayAudience] = useState<GameAudienceChoice>("anyone");
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

  const namedStores = stores.filter((store) => store.name.trim());
  const stepIndex = STEPS.findIndex((item) => item.id === step);
  const periodLabel = formatPeriod(startDate, startTime, endDate, endTime);
  const maxWinCount = Math.max(namedStores.length, 1);
  const safeWinCount = Math.min(Math.max(winCount, 1), maxWinCount);
  const ruleSentence =
    winMode === "all"
      ? `参加店舗${namedStores.length}店をすべてまわると、クーポンがもらえます`
      : winMode === "visits"
        ? `${safeWinCount}店舗を訪れると、クーポンがもらえます`
        : `${safeWinCount}スポットを達成すると、クーポンがもらえます`;
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

  function addStore() {
    if (stores.length >= 20) return;
    const next = createCouponStore();
    setStores((current) => [...current, next]);
    setEditingKey(next.key);
  }

  function updateStore(key: string, patch: Partial<CouponStore>) {
    setStores((current) => current.map((store) => (store.key === key ? { ...store, ...patch } : store)));
  }

  function moveStore(key: string, direction: -1 | 1) {
    setStores((current) => {
      const index = current.findIndex((store) => store.key === key);
      const next = index + direction;
      if (index < 0 || next < 0 || next >= current.length) return current;
      const copy = [...current];
      const [row] = copy.splice(index, 1);
      copy.splice(next, 0, row);
      return copy;
    });
  }

  function validateStep(id: StepId): string | null {
    if (id === "basic" && !name.trim()) return "ゲーム名を入力してください";
    if (id === "basic") {
      const problem = periodProblem(startDate, endDate);
      if (problem) return problem;
    }
    if (id === "rules" && useStart && useEnd && useEnd < useStart) return "クーポンの利用終了日は開始日より後にしてください";
    if (id === "rules" && playAudience !== "anyone" && !eventId) return "参加できる人を絞るときは、対象イベントを選んでください";
    if (id === "stores" && namedStores.length === 0) return "参加店舗を1つ以上追加してください";
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
    stores: stores.map(({ name: storeName, category: storeCategory, imageUrl, offer, condition, limit, published }) => ({
      name: storeName,
      category: storeCategory,
      imageUrl,
      offer,
      condition,
      limit,
      published,
    })),
    category,
    tags,
    mainImage,
    winMode,
    winCount: safeWinCount,
    oncePerPerson,
    noStack,
    useStart,
    useEnd,
    timeLimit,
    useFrom,
    useTo,
    maxCount,
    firstCome,
    autoGrant,
    audience,
  };

  async function save(status: "draft" | "published") {
    const message =
      validateStep("basic") ?? (status === "published" ? (validateStep("stores") ?? validateStep("rules")) : null);
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
          type: "coupon",
          eventId: eventId || null,
          audience: playAudience,
          description: description.trim(),
          startsAt: toIsoFromDateTime(startDate, startTime),
          endsAt: toIsoFromDateTime(endDate, endTime),
          status,
          spots: namedStores.map((store) => ({ name: store.name.trim(), kind: "stamp" })),
          coupon: settingsBody,
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

  /** 公開できないまちがい（直すまで公開しない）と、公開はできるが見直したいところ。 */
  const blockers = [
    !name.trim() ? { text: "ゲーム名が入っていません", to: "basic" as StepId } : null,
    periodProblem(startDate, endDate) ? { text: periodProblem(startDate, endDate)!, to: "basic" as StepId } : null,
    namedStores.length === 0 ? { text: "参加店舗がありません", to: "stores" as StepId } : null,
    playAudience !== "anyone" && !eventId
      ? { text: "参加できる人を絞るときは、対象イベントを選んでください", to: "basic" as StepId }
      : null,
    useStart && useEnd && useEnd < useStart ? { text: "クーポンの利用終了日が開始日より前です", to: "rules" as StepId } : null,
  ].filter((item): item is { text: string; to: StepId } => Boolean(item));
  const noOfferStores = namedStores.filter((store) => !store.offer.trim());
  const warnings = [
    !description.trim() ? { text: "説明文が空です。どんなラリーか一言あると参加しやすくなります", to: "basic" as StepId } : null,
    noOfferStores.length > 0
      ? { text: `クーポン内容が未設定の店舗が${noOfferStores.length}店あります（${noOfferStores.map((store) => store.name.trim()).join("・")}）`, to: "stores" as StepId }
      : null,
    stores.length > namedStores.length
      ? { text: `店舗名のない店舗が${stores.length - namedStores.length}件あります。名前を入れるか、削除してください`, to: "stores" as StepId }
      : null,
    useStart && useEnd && (useStart > endDate || useEnd < startDate)
      ? { text: "クーポンを使える期間が、開催期間と重なっていません", to: "rules" as StepId }
      : null,
  ].filter((item): item is { text: string; to: StepId } => Boolean(item));

  if (published) {
    return (
      <div className="org-coupon">
        <GamePublishSuccess typeLabel="クーポンラリー" />
      </div>
    );
  }

  return (
    <GameCreateShell
      title="クーポンラリー作成"
      subtitle="地域のお店をめぐってクーポンを集め、まちの魅力をもっと楽しんでもらいましょう。"
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
          kind="coupon"
          typeLabel="クーポンラリー"
          name={name}
          description={description}
          settings={settingsBody}
          look={lookEdit}
          stepView={stepIndex === 0 ? "start" : stepIndex === STEPS.length - 1 ? "clear" : "play"}
        />
      }
    >
          {step === "basic" ? (
            <section className="org-coupon__card">
              {/* 見出しは上のステップ表示に出ているので、ここでは説明だけにする。 */}
              <p style={{ marginTop: 0 }}>クーポンラリーの基本的な情報を設定しましょう。</p>
              <div className="org-coupon__grid">
                <label className="org-coupon__field org-coupon__field--wide">
                  <span>
                    ゲーム名 <em>必須</em>
                  </span>
                  <input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} required />
                  <small>{name.length}/50</small>
                </label>
                <label className="org-coupon__field org-coupon__field--wide">
                  <span>説明文</span>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} rows={3} />
                  <small>{description.length}/200</small>
                </label>
                <div className="org-coupon__field org-coupon__field--wide">
                  <span>メイン画像</span>
                  {/* 大きく出しすぎないよう、見本と横に並べる。 */}
                  <div style={{ display: "flex", gap: "0.7rem", alignItems: "flex-start" }}>
                    <div
                      className="org-coupon__main-image"
                      style={{ flex: "none", width: "min(42%, 11rem)", height: "auto", aspectRatio: "4 / 3" }}
                    >
                      <Image src={mainImage} alt="" width={640} height={480} unoptimized />
                    </div>
                    <ul className="org-coupon__thumbs" style={{ flex: 1, minWidth: 0, margin: 0 }}>
                      {COUPON_SAMPLE_IMAGES.map((src) => (
                        <li key={src}>
                          <button
                            type="button"
                            className={cn(mainImage === src && "is-on")}
                            aria-label="この見本の写真を使う"
                            onClick={() => setMainImage(src)}
                          >
                            <Image src={src} alt="" width={80} height={56} unoptimized />
                          </button>
                        </li>
                      ))}
                      {/* 見本にない写真は、ここから自分でアップロードする。 */}
                      <li>
                        <ImageUploadTile onUploaded={setMainImage} />
                      </li>
                      {!(COUPON_SAMPLE_IMAGES as readonly string[]).includes(mainImage) ? (
                        <li style={{ alignSelf: "center", fontSize: "0.7rem", fontWeight: 800, color: "#1f7a4a" }}>自分の写真を使用中</li>
                      ) : null}
                    </ul>
                  </div>
                </div>
                <div className="org-coupon__field org-coupon__field--wide">
                  <span>開催期間</span>
                  {/* 日付と時刻を1行に。開始の行・終了の行の2行にして、スマホでも窮屈にしない。 */}
                  <div
                    className="org-coupon__when"
                    style={{ gridTemplateColumns: "minmax(0, 1fr) 6.5rem", gap: "0.35rem 0.4rem" }}
                  >
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
                <label className="org-coupon__field org-coupon__field--wide">
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
                  {eventHint ? <small>{eventHint}</small> : null}
                </label>
                <div className="org-coupon__field org-coupon__field--wide">
                  <span>カテゴリ</span>
                  <ul className="org-coupon__cats">
                    {COUPON_CATEGORIES.map((item) => (
                      <li key={item}>
                        <button type="button" className={cn(category === item && "is-on")} onClick={() => setCategory(item)}>
                          {item}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="org-coupon__field org-coupon__field--wide">
                  <span>タグ</span>
                  <div className="org-coupon__tags">
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

          {step === "stores" ? (
            <section className="org-coupon__card">
              <div className="org-coupon__card-head">
                <div>
                  <h2>
                    参加店舗・クーポン設定
                  </h2>
                  <p>クーポンラリーに参加する店舗と、各店舗のクーポンを設定しましょう。</p>
                </div>
              </div>
              {stores.length === 0 ? (
                <p className="org-coupon__empty">まだ店舗がありません。参加店舗を追加しましょう。</p>
              ) : (
                <ul className="org-coupon__srows">
                  {stores.map((store, index) => {
                    const open = store.key === editingKey;
                    return (
                      <li key={store.key} className={cn(open && "is-open")}>
                        {/* 行のどこを押しても開く。開いた店舗の下にそのまま入力欄を出す。 */}
                        <button
                          type="button"
                          className="org-coupon__srow"
                          aria-expanded={open}
                          onClick={() => setEditingKey(open ? null : store.key)}
                        >
                          <Image src={store.imageUrl} alt="" width={120} height={90} unoptimized />
                          <span className="org-coupon__srow-text">
                            <strong>{store.name.trim() || "新しい店舗"}</strong>
                            <em className={cn(!store.offer.trim() && "is-empty")}>{store.offer.trim() || "クーポン未設定"}</em>
                            <small>
                              {store.category}・{store.limit}枚{store.condition.trim() ? `・${store.condition.trim()}` : ""}
                            </small>
                          </span>
                          <span className="org-coupon__srow-edit">
                            {open ? <Check className="h-4 w-4" aria-hidden /> : <Pencil className="h-4 w-4" aria-hidden />}
                            {open ? "完了" : "編集"}
                          </span>
                        </button>
                        {open ? (
                          <div className="org-coupon__editor">
                            <label>
                              店舗名
                              <input
                                value={store.name}
                                onChange={(e) => updateStore(store.key, { name: e.target.value })}
                                placeholder="さくらベーカリー"
                                autoFocus={!store.name}
                              />
                            </label>
                            <label>
                              カテゴリ
                              <select value={store.category} onChange={(e) => updateStore(store.key, { category: e.target.value })}>
                                {COUPON_CATEGORIES.map((item) => (
                                  <option key={item} value={item}>
                                    {item}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label>
                              クーポン内容
                              <input
                                value={store.offer}
                                onChange={(e) => updateStore(store.key, { offer: e.target.value })}
                                placeholder="100円引き"
                              />
                            </label>
                            <label>
                              利用条件
                              <input
                                value={store.condition}
                                onChange={(e) => updateStore(store.key, { condition: e.target.value })}
                                placeholder="税込1,000円以上のお会計で"
                              />
                            </label>
                            <label>
                              配布数（枚）
                              <input
                                type="number"
                                inputMode="numeric"
                                min={0}
                                max={9999}
                                value={store.limit}
                                onChange={(e) => updateStore(store.key, { limit: Number(e.target.value) || 0 })}
                              />
                            </label>
                            <div>
                              <span>店舗画像</span>
                              <ul className="org-coupon__thumbs">
                                {COUPON_SAMPLE_IMAGES.map((src) => (
                                  <li key={src}>
                                    <button
                                      type="button"
                                      className={cn(store.imageUrl === src && "is-on")}
                                      aria-label="この見本の写真を使う"
                                      onClick={() => updateStore(store.key, { imageUrl: src })}
                                    >
                                      <Image src={src} alt="" width={80} height={56} unoptimized />
                                    </button>
                                  </li>
                                ))}
                                <li>
                                  <ImageUploadTile onUploaded={(url) => updateStore(store.key, { imageUrl: url })} />
                                </li>
                              </ul>
                            </div>
                            <div className="org-coupon__editor-foot">
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => moveStore(store.key, -1)}
                                aria-label="ひとつ上へ"
                              >
                                <ChevronUp className="h-4 w-4" aria-hidden />
                              </button>
                              <button
                                type="button"
                                disabled={index === stores.length - 1}
                                onClick={() => moveStore(store.key, 1)}
                                aria-label="ひとつ下へ"
                              >
                                <ChevronDown className="h-4 w-4" aria-hidden />
                              </button>
                              <button
                                type="button"
                                className="is-danger"
                                onClick={() => {
                                  if (store.name.trim() && !window.confirm(`「${store.name.trim()}」を削除しますか？`)) return;
                                  setStores((current) => current.filter((item) => item.key !== store.key));
                                  setEditingKey(null);
                                }}
                              >
                                <Trash2 className="h-4 w-4" aria-hidden />
                                削除
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
              {stores.length < 20 ? (
                <button type="button" className="org-coupon__add-row" onClick={addStore}>
                  <Plus className="h-4 w-4" aria-hidden />
                  店舗を追加（{stores.length}/20）
                </button>
              ) : null}
            </section>
          ) : null}

          {step === "rules" ? (
            <section className="org-coupon__card">
              {/* いまの設定を、参加者に伝わる言葉で上にまとめて出す。 */}
              <div className="org-coupon__rule-sum" aria-live="polite">
                <strong>{ruleSentence}</strong>
                <span>
                  {oncePerPerson ? "1人1回まで" : "何回でも利用可"}
                  {noStack ? "・他のクーポンと併用不可" : ""}
                  ・{maxCount > 0 ? `${firstCome ? "先着" : "上限"}${maxCount.toLocaleString()}枚` : "枚数の上限なし"}
                </span>
              </div>

              <div className="org-coupon__rule">
                <h3>もらえる条件</h3>
                <ul className="org-coupon__radios" role="radiogroup" aria-label="クーポンがもらえる条件">
                  {COUPON_WIN_MODES.map((mode) => {
                    const on = winMode === mode.id;
                    return (
                      <li key={mode.id}>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={on}
                          className={cn(on && "is-on")}
                          onClick={() => setWinMode(mode.id)}
                        >
                          <i aria-hidden />
                          <span>
                            <strong>{mode.label}</strong>
                            <small>{mode.blurb}</small>
                          </span>
                        </button>
                        {on && mode.id !== "all" ? (
                          <div className="org-coupon__count">
                            <span>{mode.id === "visits" ? "訪れる店舗の数" : "達成するスポットの数"}</span>
                            <div>
                              <button
                                type="button"
                                aria-label="ひとつ減らす"
                                disabled={safeWinCount <= 1}
                                onClick={() => setWinCount(safeWinCount - 1)}
                              >
                                <Minus className="h-4 w-4" aria-hidden />
                              </button>
                              <b>
                                {safeWinCount}
                                <small> / {maxWinCount}</small>
                              </b>
                              <button
                                type="button"
                                aria-label="ひとつ増やす"
                                disabled={safeWinCount >= maxWinCount}
                                onClick={() => setWinCount(safeWinCount + 1)}
                              >
                                <Plus className="h-4 w-4" aria-hidden />
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="org-coupon__rule">
                <h3>使えるルール</h3>
                <RuleSwitch checked={oncePerPerson} onChange={setOncePerPerson} label="1人1回まで" hint="同じ人が何度も使えないようにします" />
                <RuleSwitch checked={noStack} onChange={setNoStack} label="他のクーポンと併用不可" />
                <div className="org-coupon__use-period">
                  <span>使える期間</span>
                  <div>
                    <input type="date" aria-label="利用開始日" value={useStart} onChange={(e) => setUseStart(e.target.value)} />
                    <span>〜</span>
                    <input
                      type="date"
                      aria-label="利用終了日"
                      value={useEnd}
                      min={useStart || undefined}
                      onChange={(e) => setUseEnd(e.target.value)}
                    />
                  </div>
                  {useStart !== startDate || useEnd !== endDate ? (
                    <button
                      type="button"
                      onClick={() => {
                        setUseStart(startDate);
                        setUseEnd(endDate);
                      }}
                    >
                      開催期間（{startDate.slice(5).replace("-", "/")}〜{endDate.slice(5).replace("-", "/")}）と同じにする
                    </button>
                  ) : (
                    <small>開催期間と同じです</small>
                  )}
                </div>
                <RuleSwitch checked={timeLimit} onChange={setTimeLimit} label="使える時間帯を決める" hint="お店の営業時間に合わせたいときに" />
                {timeLimit ? (
                  <div className="org-coupon__use-time">
                    <input type="time" aria-label="利用開始時刻" value={useFrom} onChange={(e) => setUseFrom(e.target.value)} />
                    <span>〜</span>
                    <input type="time" aria-label="利用終了時刻" value={useTo} onChange={(e) => setUseTo(e.target.value)} />
                  </div>
                ) : null}
              </div>

              <div className="org-coupon__rule">
                <h3>配る枚数</h3>
                <div className="org-coupon__max">
                  <label>
                    <span>全体の上限</span>
                    <div>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={99999}
                        value={maxCount}
                        onChange={(e) => setMaxCount(Math.max(0, Number(e.target.value) || 0))}
                      />
                      <em>枚</em>
                    </div>
                  </label>
                  <ul>
                    {[100, 300, 500, 1000].map((count) => (
                      <li key={count}>
                        <button type="button" className={cn(maxCount === count && "is-on")} onClick={() => setMaxCount(count)}>
                          {count.toLocaleString()}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <RuleSwitch checked={firstCome} onChange={setFirstCome} label="先着順で配る" hint="上限に達したら配布を終わります" />
                <RuleSwitch checked={autoGrant} onChange={setAutoGrant} label="条件を満たしたら自動で渡す" />
              </div>

              <div className="org-coupon__rule">
                <AudienceField value={playAudience} onChange={setPlayAudience} eventChosen={Boolean(eventId)} />
              </div>
            </section>
          ) : null}

          {step === "publish" ? (
            <section className="org-coupon__card org-coupon__review">
              {/* 公開できるかを一番上に。直すところは、そのステップへ飛べるようにする。 */}
              {blockers.length > 0 ? (
                <div className="org-coupon__ready is-blocked" role="status">
                  <strong>公開する前に、{blockers.length}件直してください</strong>
                  <ul>
                    {blockers.map((item) => (
                      <li key={item.text}>
                        <span>{item.text}</span>
                        <button type="button" onClick={() => goTo(item.to)}>
                          直す
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="org-coupon__ready" role="status">
                  <Check className="h-5 w-5" aria-hidden />
                  <div>
                    <strong>公開の準備ができました</strong>
                    <span>内容を確かめて、下の「公開する」を押してください。「お試しで見る」で参加者の流れも確かめられます。</span>
                  </div>
                </div>
              )}
              {warnings.length > 0 ? (
                <ul className="org-coupon__warns">
                  {warnings.map((item) => (
                    <li key={item.text}>
                      <span>{item.text}</span>
                      <button type="button" onClick={() => goTo(item.to)}>
                        見直す
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="org-coupon__rv-hero">
                <Image src={mainImage} alt="" width={240} height={180} unoptimized />
                <div>
                  <strong>{name.trim() || "ゲーム名が未入力"}</strong>
                  <span>{periodLabel ?? "期間が未設定"}</span>
                  {description.trim() ? <p>{description.trim()}</p> : null}
                </div>
                <button type="button" className="org-coupon__rv-edit" onClick={() => goTo("basic")}>
                  変更
                </button>
              </div>

              <div className="org-coupon__rv">
                <div className="org-coupon__rv-head">
                  <h3>参加店舗とクーポン（{namedStores.length}店）</h3>
                  <button type="button" className="org-coupon__rv-edit" onClick={() => goTo("stores")}>
                    変更
                  </button>
                </div>
                {namedStores.length > 0 ? (
                  <ul className="org-coupon__rv-stores">
                    {namedStores.map((store) => (
                      <li key={store.key}>
                        <b>{store.name.trim()}</b>
                        <em className={cn(!store.offer.trim() && "is-empty")}>{store.offer.trim() || "クーポン未設定"}</em>
                        <small>{store.limit}枚</small>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="org-coupon__rv-empty">まだ店舗がありません</p>
                )}
              </div>

              <div className="org-coupon__rv">
                <div className="org-coupon__rv-head">
                  <h3>取得・利用条件</h3>
                  <button type="button" className="org-coupon__rv-edit" onClick={() => goTo("rules")}>
                    変更
                  </button>
                </div>
                <dl className="org-coupon__rv-list">
                  <div>
                    <dt>もらえる条件</dt>
                    <dd>{ruleSentence}</dd>
                  </div>
                  <div>
                    <dt>使えるルール</dt>
                    <dd>
                      {oncePerPerson ? "1人1回まで" : "何回でも利用可"}
                      {noStack ? "・併用不可" : ""}
                    </dd>
                  </div>
                  <div>
                    <dt>使える期間</dt>
                    <dd>
                      {useStart.replaceAll("-", "/")} 〜 {useEnd.replaceAll("-", "/")}
                      {timeLimit ? `（${useFrom}〜${useTo}）` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt>配る枚数</dt>
                    <dd>
                      {maxCount > 0 ? `${firstCome ? "先着" : "上限"}${maxCount.toLocaleString()}枚` : "上限なし"}
                      {autoGrant ? "・自動で渡す" : "・手動で渡す"}
                    </dd>
                  </div>
                  <div>
                    <dt>参加できる人</dt>
                    <dd>
                      {playAudience === "event"
                        ? "イベントの参加者だけ"
                        : playAudience === "pass"
                          ? "参加パスを持っている人だけ"
                          : "誰でも"}
                    </dd>
                  </div>
                </dl>
              </div>
            </section>
          ) : null}
      {testing ? (
        <CouponTestPlay
          name={name}
          description={description}
          stores={stores}
          winMode={winMode}
          winCount={winCount}
          oncePerPerson={oncePerPerson}
          noStack={noStack}
          autoGrant={autoGrant}
          onClose={() => setTesting(false)}
        />
      ) : null}
    </GameCreateShell>
  );
}

/** 使えるルールなどの、オン・オフのスイッチの行。 */
function RuleSwitch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="org-coupon__switch">
      <span>
        <strong>{label}</strong>
        {hint ? <small>{hint}</small> : null}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
