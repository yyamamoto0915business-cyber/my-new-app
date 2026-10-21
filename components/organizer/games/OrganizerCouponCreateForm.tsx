"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ImagePlus,
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
  COUPON_AUDIENCES,
  COUPON_CATEGORIES,
  COUPON_SAMPLE_IMAGES,
  COUPON_WIN_MODES,
  couponWinLabel,
  createCouponStore,
  sampleCouponStores,
  type CouponAudience,
  type CouponCategory,
  type CouponStore,
  type CouponWinMode,
} from "@/lib/organizer/coupon";
import { CouponTestPlay } from "@/components/organizer/games/CouponTestPlay";
import { GamePhonePreview } from "@/components/organizer/games/GamePhonePreview";
import { GameCreateShell, type GameCreateStep } from "@/components/organizer/games/GameCreateShell";
import { GamePublishSuccess } from "@/components/organizer/games/GamePublishSuccess";

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
  const router = useRouter();
  const [step, setStep] = useState<StepId>("basic");
  const [name, setName] = useState("まちなかグルメクーポンラリー");
  const [description, setDescription] = useState(
    "まちなかの対象店舗をめぐってクーポンを集めよう！グルメ・ショッピング・体験など、さまざまなお店で使えるお得なクーポンがもらえます。"
  );
  const [eventId, setEventId] = useState("");
  const [startDate, setStartDate] = useState("2026-04-01");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("2026-04-30");
  const [endTime, setEndTime] = useState("18:00");
  const [events, setEvents] = useState<OrganizerGameEventOption[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [mainImage, setMainImage] = useState<(typeof COUPON_SAMPLE_IMAGES)[number]>(COUPON_SAMPLE_IMAGES[1]);
  const [category, setCategory] = useState<CouponCategory>("グルメ");
  const [tags, setTags] = useState<string[]>(["グルメ", "食べ歩き", "春のまつり"]);
  const [tagDraft, setTagDraft] = useState("");
  const [stores, setStores] = useState<CouponStore[]>(() => sampleCouponStores());
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [winMode, setWinMode] = useState<CouponWinMode>("spots");
  const [winCount, setWinCount] = useState(2);
  const [oncePerPerson, setOncePerPerson] = useState(true);
  const [noStack, setNoStack] = useState(true);
  const [useStart, setUseStart] = useState("2026-04-01");
  const [useEnd, setUseEnd] = useState("2026-04-30");
  const [timeLimit, setTimeLimit] = useState(false);
  const [useFrom, setUseFrom] = useState("09:00");
  const [useTo, setUseTo] = useState("18:00");
  const [maxCount, setMaxCount] = useState(500);
  const [firstCome, setFirstCome] = useState(true);
  const [autoGrant, setAutoGrant] = useState(true);
  const [audience, setAudience] = useState<CouponAudience>("anyone");
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
  const editing = stores.find((store) => store.key === editingKey) ?? null;
  const winLabel = couponWinLabel(winMode, winCount, namedStores.length);
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
    winCount,
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
    const message = validateStep("basic") ?? (status === "published" ? validateStep("stores") : null);
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
          description: description.trim(),
          startsAt: toIsoFromDateTime(startDate, startTime),
          endsAt: toIsoFromDateTime(endDate, endTime),
          status,
          spots: namedStores.map((store) => ({ name: store.name.trim(), kind: "stamp" })),
          coupon: settingsBody,
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

  const checks = [
    { ok: Boolean(name.trim() && description.trim() && startDate && endDate), label: "基本情報が設定されています" },
    { ok: namedStores.length > 0, label: `店舗が設定されています（${namedStores.length}店舗）` },
    { ok: namedStores.some((store) => store.offer.trim()), label: "クーポンが設定されています" },
    { ok: Boolean(winMode), label: "取得・利用条件が設定されています" },
    { ok: Boolean(mainImage), label: "メイン画像が設定されています" },
  ];

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
          stepView={stepIndex === 0 ? "start" : stepIndex === STEPS.length - 1 ? "clear" : "play"}
        />
      }
    >
          {step === "basic" ? (
            <section className="org-coupon__card">
              <h2>
                <span>1</span>
                基本設定
              </h2>
              <p>クーポンラリーの基本的な情報を設定しましょう。</p>
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
                <div className="org-coupon__field">
                  <span>メイン画像</span>
                  <div className="org-coupon__main-image">
                    <Image src={mainImage} alt="" width={640} height={360} unoptimized />
                    <span>
                      <ImagePlus className="h-3.5 w-3.5" aria-hidden />
                      画像を変更
                    </span>
                  </div>
                  <ul className="org-coupon__thumbs">
                    {COUPON_SAMPLE_IMAGES.map((src) => (
                      <li key={src}>
                        <button type="button" className={cn(mainImage === src && "is-on")} onClick={() => setMainImage(src)}>
                          <Image src={src} alt="" width={80} height={56} unoptimized />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="org-coupon__field org-coupon__field--wide">
                  <span>開催期間</span>
                  <div className="org-coupon__when">
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                    <span>〜</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                  </div>
                </div>
                <label className="org-coupon__field org-coupon__field--wide">
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
                    <span>2</span>
                    参加店舗・クーポン設定
                  </h2>
                  <p>クーポンラリーに参加する店舗と、各店舗のクーポンを設定しましょう。</p>
                </div>
                <button type="button" className="org-coupon__add" onClick={addStore} disabled={stores.length >= 20}>
                  <Plus className="h-4 w-4" aria-hidden />
                  店舗を追加
                </button>
              </div>
              {stores.length === 0 ? (
                <p className="org-coupon__empty">まだ店舗がありません。参加店舗を追加しましょう。</p>
              ) : (
                <ul className="org-coupon__stores">
                  {stores.map((store) => (
                    <li key={store.key}>
                      <Image src={store.imageUrl} alt="" width={220} height={140} unoptimized />
                      <div>
                        <strong>{store.name.trim() || "新しい店舗"}</strong>
                        <span>{store.category}</span>
                        <em>{store.offer.trim() || "クーポン未設定"}</em>
                      </div>
                      <div className="org-coupon__store-actions">
                        <button type="button" onClick={() => moveStore(store.key, -1)} aria-label="上へ">
                          <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                        </button>
                        <button type="button" onClick={() => moveStore(store.key, 1)} aria-label="下へ">
                          <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                        </button>
                        <button type="button" onClick={() => setEditingKey(store.key === editingKey ? null : store.key)}>
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                          {store.key === editingKey ? "閉じる" : "編集"}
                        </button>
                        <button type="button" onClick={() => setStores((current) => current.filter((item) => item.key !== store.key))}>
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {editing ? (
                <div className="org-coupon__editor">
                  <label>
                    店舗名
                    <input
                      value={editing.name}
                      onChange={(e) => updateStore(editing.key, { name: e.target.value })}
                      placeholder="さくらベーカリー"
                    />
                  </label>
                  <label>
                    カテゴリ
                    <select
                      value={editing.category}
                      onChange={(e) => updateStore(editing.key, { category: e.target.value })}
                    >
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
                      value={editing.offer}
                      onChange={(e) => updateStore(editing.key, { offer: e.target.value })}
                      placeholder="100円引き"
                    />
                  </label>
                  <label>
                    利用条件
                    <input
                      value={editing.condition}
                      onChange={(e) => updateStore(editing.key, { condition: e.target.value })}
                      placeholder="税込1,000円以上のお会計で"
                    />
                  </label>
                  <label>
                    配布数
                    <input
                      type="number"
                      min={0}
                      max={9999}
                      value={editing.limit}
                      onChange={(e) => updateStore(editing.key, { limit: Number(e.target.value) || 0 })}
                    />
                  </label>
                  <div>
                    <span>店舗画像</span>
                    <ul className="org-coupon__thumbs">
                      {COUPON_SAMPLE_IMAGES.map((src) => (
                        <li key={src}>
                          <button
                            type="button"
                            className={cn(editing.imageUrl === src && "is-on")}
                            onClick={() => updateStore(editing.key, { imageUrl: src })}
                          >
                            <Image src={src} alt="" width={80} height={56} unoptimized />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
              {namedStores.length > 0 ? (
                <div className="org-coupon__table-wrap">
                  <p className="org-coupon__sub">クーポン一覧</p>
                  <table className="org-coupon__table">
                    <thead>
                      <tr>
                        <th>店舗名</th>
                        <th>クーポン内容</th>
                        <th>利用条件</th>
                        <th>配布数</th>
                      </tr>
                    </thead>
                    <tbody>
                      {namedStores.map((store) => (
                        <tr key={store.key}>
                          <td>{store.name}</td>
                          <td>{store.offer || "—"}</td>
                          <td>{store.condition || "—"}</td>
                          <td>{store.limit}枚</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </section>
          ) : null}

          {step === "rules" ? (
            <section className="org-coupon__card">
              <h2>
                <span>3</span>
                取得条件・利用条件
              </h2>
              <p>クーポンの獲得条件や利用ルールを設定しましょう。</p>
              <p className="org-coupon__sub">クーポン獲得条件</p>
              <ul className="org-coupon__modes">
                {COUPON_WIN_MODES.map((mode) => (
                  <li key={mode.id}>
                    <button
                      type="button"
                      className={cn(winMode === mode.id && "is-on")}
                      onClick={() => setWinMode(mode.id)}
                    >
                      <strong>{mode.label}</strong>
                      <span>{mode.blurb}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {winMode !== "all" ? (
                <label className="org-coupon__field">
                  <span>{winMode === "visits" ? "必要な店舗数" : "必要なスポット数"}</span>
                  <select value={winCount} onChange={(e) => setWinCount(Number(e.target.value))}>
                    {Array.from({ length: Math.max(namedStores.length, 1) }, (_, index) => index + 1).map((count) => (
                      <option key={count} value={count}>
                        {count}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <p className="org-coupon__sub">利用条件</p>
              <label className="org-coupon__check">
                <input type="checkbox" checked={oncePerPerson} onChange={(e) => setOncePerPerson(e.target.checked)} />
                1人1回まで利用可能
              </label>
              <label className="org-coupon__check">
                <input type="checkbox" checked={noStack} onChange={(e) => setNoStack(e.target.checked)} />
                他のクーポンと併用不可
              </label>
              <div className="org-coupon__when org-coupon__when--dates">
                <label>
                  利用開始
                  <input type="date" value={useStart} onChange={(e) => setUseStart(e.target.value)} />
                </label>
                <label>
                  利用終了
                  <input type="date" value={useEnd} onChange={(e) => setUseEnd(e.target.value)} />
                </label>
              </div>
              <label className="org-coupon__check">
                <input type="checkbox" checked={timeLimit} onChange={(e) => setTimeLimit(e.target.checked)} />
                利用可能時間を指定する
              </label>
              {timeLimit ? (
                <div className="org-coupon__when org-coupon__when--dates">
                  <input type="time" value={useFrom} onChange={(e) => setUseFrom(e.target.value)} />
                  <span>〜</span>
                  <input type="time" value={useTo} onChange={(e) => setUseTo(e.target.value)} />
                </div>
              ) : null}
              <p className="org-coupon__sub">配布設定</p>
              <label className="org-coupon__field">
                <span>配布上限数</span>
                <input
                  type="number"
                  min={0}
                  max={99999}
                  value={maxCount}
                  onChange={(e) => setMaxCount(Number(e.target.value) || 0)}
                />
              </label>
              <label className="org-coupon__check">
                <input type="checkbox" checked={firstCome} onChange={(e) => setFirstCome(e.target.checked)} />
                先着順で配布
              </label>
              <label className="org-coupon__check">
                <input type="checkbox" checked={autoGrant} onChange={(e) => setAutoGrant(e.target.checked)} />
                条件達成時に自動配布
              </label>
              <p className="org-coupon__sub">参加対象</p>
              <ul className="org-coupon__audience">
                {COUPON_AUDIENCES.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={cn(audience === item.id && "is-on")}
                      onClick={() => setAudience(item.id)}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
              <aside className="org-coupon__now">
                <p>現在の設定</p>
                <dl>
                  <div>
                    <dt>獲得条件</dt>
                    <dd>{winLabel}</dd>
                  </div>
                  <div>
                    <dt>利用条件</dt>
                    <dd>
                      {oncePerPerson ? "1人1回まで" : "回数制限なし"}
                      {noStack ? "・併用不可" : ""}
                    </dd>
                  </div>
                  <div>
                    <dt>配布</dt>
                    <dd>
                      上限 {maxCount}枚
                      {firstCome ? "・先着順" : ""}
                      {autoGrant ? "・自動配布" : ""}
                    </dd>
                  </div>
                </dl>
              </aside>
            </section>
          ) : null}

          {step === "publish" ? (
            <section className="org-coupon__card">
              <h2>
                <span>4</span>
                確認・公開
              </h2>
              <p>これまでの設定内容を確認し、公開しましょう。</p>
              <dl className="org-coupon__summary">
                <div>
                  <dt>ゲーム名</dt>
                  <dd>{name.trim() || "未入力"}</dd>
                </div>
                <div>
                  <dt>期間</dt>
                  <dd>{periodLabel ?? "未設定"}</dd>
                </div>
                <div>
                  <dt>参加店舗</dt>
                  <dd>{namedStores.length} 店舗</dd>
                </div>
                <div>
                  <dt>獲得条件</dt>
                  <dd>{winLabel}</dd>
                </div>
              </dl>
              <p className="org-coupon__sub">公開前チェック</p>
              <ul className="org-coupon__checks">
                {checks.map((item) => (
                  <li key={item.label} className={cn(item.ok && "is-ok")}>
                    <Check className="h-3.5 w-3.5" aria-hidden />
                    {item.label}
                  </li>
                ))}
              </ul>
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
