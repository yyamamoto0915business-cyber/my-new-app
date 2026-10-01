"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Gift,
  ImagePlus,
  KeyRound,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  QrCode,
  Share2,
  Trash2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { OrganizerGameEventOption } from "@/lib/organizer/games";
import {
  CHECKIN_AUDIENCES,
  CHECKIN_CATEGORIES,
  CHECKIN_CLEAR_MODES,
  CHECKIN_METHODS,
  CHECKIN_SAMPLE_IMAGES,
  checkinClearLabel,
  checkinMethodLabel,
  checkinSpotValue,
  createCheckinSpot,
  sampleCheckinSpots,
  type CheckinAudience,
  type CheckinCategory,
  type CheckinClearMode,
  type CheckinMethod,
  type CheckinSpot,
} from "@/lib/organizer/checkin";
import { OrganizerCheckinPreview } from "@/components/organizer/games/OrganizerCheckinPreview";
import { GamePublishSuccess } from "@/components/organizer/games/GamePublishSuccess";

const STEPS = [
  { id: "basic", label: "基本設定" },
  { id: "spots", label: "スポット設定" },
  { id: "rewards", label: "達成条件・特典" },
  { id: "publish", label: "確認・公開" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const HERO: Record<StepId, { title: string; lead: string; points: string[] }> = {
  basic: {
    title: "まちをめぐってチェックインしよう！",
    lead: "いろいろなスポットをめぐって、まちの魅力を発見する回遊型の体験を作成できます。",
    points: ["回遊を促進", "来場確認ができる", "参加しやすい"],
  },
  spots: {
    title: "チェックインスポットを設定しよう！",
    lead: "まちの見どころやおすすめスポットを登録して、参加者がめぐるコースをつくりましょう。",
    points: ["地図でかんたん設定", "さまざまなチェックイン方法", "スポットの並び順を調整"],
  },
  rewards: {
    title: "達成条件・特典を設定しよう！",
    lead: "どのくらい回るとクリアにするか、クリアしたときの特典を設定して参加の楽しさをアップさせましょう。",
    points: ["達成の喜びを演出", "再訪を促進", "参加意欲が高まる", "まちのファンを増やす"],
  },
  publish: {
    title: "設定が完了しました！",
    lead: "内容を確認して、イベントを公開しましょう。公開すると、参加者がチェックインに参加できるようになります。",
    points: [],
  },
};

function toIsoFromDateTime(date: string, time: string): string | null {
  if (!date) return null;
  const value = new Date(`${date}T${time || "00:00"}:00+09:00`);
  if (Number.isNaN(value.getTime())) return null;
  return value.toISOString();
}

function formatPeriod(startDate: string, startTime: string, endDate: string, endTime: string): string | null {
  const fmt = (date: string, time: string) => {
    if (!date) return "";
    return `${date.replaceAll("-", "/")} ${time || "00:00"}`;
  };
  if (startDate && endDate) return `${fmt(startDate, startTime)} 〜 ${fmt(endDate, endTime)}`;
  if (startDate) return `${fmt(startDate, startTime)} から`;
  if (endDate) return `${fmt(endDate, endTime)} まで`;
  return null;
}

function MethodIcon({ method }: { method: CheckinMethod }) {
  if (method === "qr") return <QrCode className="h-4 w-4" aria-hidden />;
  if (method === "keyword") return <KeyRound className="h-4 w-4" aria-hidden />;
  return <MapPin className="h-4 w-4" aria-hidden />;
}

export function OrganizerCheckinCreateForm() {
  const router = useRouter();
  const [step, setStep] = useState<StepId>("basic");
  const [name, setName] = useState("春のまち歩きチェックイン");
  const [description, setDescription] = useState(
    "まちのスポットをめぐってチェックインしながら、春のまちの魅力を発見しましょう！すべてのスポットを巡って、素敵な特典をゲットしよう！"
  );
  const [eventId, setEventId] = useState("");
  const [startDate, setStartDate] = useState("2026-04-01");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("2026-04-30");
  const [endTime, setEndTime] = useState("18:00");
  const [events, setEvents] = useState<OrganizerGameEventOption[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [mainImage, setMainImage] = useState<(typeof CHECKIN_SAMPLE_IMAGES)[number]>(CHECKIN_SAMPLE_IMAGES[0]);
  const [category, setCategory] = useState<CheckinCategory>("まち歩き");
  const [tags, setTags] = useState<string[]>(["まち歩き", "観光"]);
  const [tagDraft, setTagDraft] = useState("");
  const [audience, setAudience] = useState<CheckinAudience>("anyone");
  const [defaultMethod, setDefaultMethod] = useState<CheckinMethod>("gps");
  const [spots, setSpots] = useState<CheckinSpot[]>(() => sampleCheckinSpots());
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [clearMode, setClearMode] = useState<CheckinClearMode>("count");
  const [clearCount, setClearCount] = useState(3);
  const [couponOn, setCouponOn] = useState(true);
  const [pointsOn, setPointsOn] = useState(true);
  const [stampOn, setStampOn] = useState(false);
  const [prizeOn, setPrizeOn] = useState(false);
  const [couponName, setCouponName] = useState("まち歩き応援クーポン");
  const [couponDetail, setCouponDetail] = useState("対象店舗で使える 10%OFF クーポンです。まち歩きのあと、ぜひお立ち寄りください！");
  const [points, setPoints] = useState(100);
  const [receivePlace, setReceivePlace] = useState<"app" | "venue">("app");
  const [maxCount, setMaxCount] = useState(500);
  const [rankingOn, setRankingOn] = useState(true);
  const [hintOn, setHintOn] = useState(true);
  const [publicToPlayers, setPublicToPlayers] = useState(true);
  const [showOnEvent, setShowOnEvent] = useState(true);
  const [showRanking, setShowRanking] = useState(true);
  const [confirmOk, setConfirmOk] = useState(false);
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

  const namedSpots = spots.filter((spot) => spot.name.trim());
  const stepIndex = STEPS.findIndex((item) => item.id === step);
  const periodLabel = formatPeriod(startDate, startTime, endDate, endTime);
  const editing = spots.find((spot) => spot.key === editingKey) ?? null;
  const clearLabel = checkinClearLabel(clearMode, clearCount, namedSpots.length);
  const eventTitle = events.find((event) => event.id === eventId)?.title ?? "あとで選ぶ";
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
    if (spots.length >= 20) return;
    const next = createCheckinSpot(defaultMethod);
    setSpots((current) => [...current, next]);
    setEditingKey(next.key);
  }

  function updateSpot(key: string, patch: Partial<CheckinSpot>) {
    setSpots((current) => current.map((spot) => (spot.key === key ? { ...spot, ...patch } : spot)));
  }

  function moveSpot(key: string, direction: -1 | 1) {
    setSpots((current) => {
      const index = current.findIndex((spot) => spot.key === key);
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
    if (id === "spots" && namedSpots.length === 0) return "スポットを1つ以上追加してください";
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
    if (next.id === "rewards" || next.id === "publish") setPreviewTab("rewards");
    if (next.id === "basic") setPreviewTab("cover");
  }

  function goPrev() {
    setError(null);
    const prev = STEPS[Math.max(stepIndex - 1, 0)];
    setStep(prev.id);
    if (prev.id === "spots") setPreviewTab("spots");
    if (prev.id === "rewards") setPreviewTab("rewards");
    if (prev.id === "basic") setPreviewTab("cover");
  }

  async function save(status: "draft" | "published") {
    const message = validateStep("basic") ?? (status === "published" ? validateStep("spots") : null);
    if (message) {
      setError(message);
      return;
    }
    if (status === "published" && !confirmOk) {
      setError("公開前に、内容の確認にチェックしてください");
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
          type: "checkin",
          eventId: eventId || null,
          description: description.trim(),
          startsAt: toIsoFromDateTime(startDate, startTime),
          endsAt: toIsoFromDateTime(endDate, endTime),
          status,
          spots: namedSpots.map((spot) => ({ name: spot.name.trim(), kind: "stamp" })),
          checkin: {
            spots: spots.map(({ name: spotName, place, method, radius, keyword, reward, published, imageUrl, pinX, pinY }) => ({
              name: spotName,
              place,
              method,
              radius,
              keyword,
              reward,
              published,
              imageUrl,
              pinX,
              pinY,
            })),
            category,
            tags,
            mainImage,
            defaultMethod,
            audience,
            clearMode,
            clearCount,
            couponOn,
            pointsOn,
            stampOn,
            prizeOn,
            couponName,
            couponDetail,
            points,
            receivePlace,
            maxCount,
            rankingOn,
            hintOn,
            publicToPlayers,
            showOnEvent,
            showRanking,
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

  const hero = HERO[step];
  const checks = [
    { ok: Boolean(name.trim() && description.trim() && startDate && endDate), label: "ゲームの基本情報が設定されています" },
    { ok: namedSpots.length > 0, label: "スポットが1つ以上設定されています" },
    { ok: namedSpots.every((spot) => spot.method), label: "チェックイン方法が設定されています" },
    { ok: Boolean(clearMode), label: "達成条件・特典が設定されています" },
    { ok: publicToPlayers, label: "公開設定が完了しています" },
  ];

  if (published) {
    return (
      <div className="org-checkin">
        <GamePublishSuccess typeLabel="チェックイン" />
      </div>
    );
  }

  return (
    <div className="org-checkin">
      <Link href="/organizer/games" className="org-checkin__back">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        ゲーム機能に戻る
      </Link>

      <header className="org-checkin__title">
        <h1>チェックイン作成</h1>
        <p>スポットに来てチェックインする、回遊型の体験をかんたん作成しましょう。</p>
      </header>

      <ol className="org-checkin__steps" aria-label="作成の手順">
        {STEPS.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              className={cn(step === item.id && "is-on", index < stepIndex && "is-done")}
              onClick={() => setStep(item.id)}
            >
              <em>{index < stepIndex ? <Check className="h-3 w-3" aria-hidden /> : index + 1}</em>
              {item.label}
            </button>
          </li>
        ))}
      </ol>

      <section className={cn("org-checkin__banner", step === "publish" && "is-done")}>
        <Image src="/organizer/games/game-type-checkin.png" alt="" width={120} height={120} unoptimized />
        <div>
          <h2>{hero.title}</h2>
          <p>{hero.lead}</p>
          {hero.points.length > 0 ? (
            <ul>
              {hero.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <div className="org-checkin__layout">
        <div className="org-checkin__main">
          {step === "basic" ? (
            <section className="org-checkin__card">
              <h2>
                <span>1</span>
                基本情報
              </h2>
              <p>まずはゲームの基本情報を設定しましょう。</p>
              <div className="org-checkin__grid">
                <label className="org-checkin__field">
                  <span>
                    ゲーム名 <em>必須</em>
                  </span>
                  <input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} required />
                  <small>{name.length}/50</small>
                </label>
                <label className="org-checkin__field">
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
                <div className="org-checkin__field org-checkin__field--wide">
                  <span>開催期間</span>
                  <div className="org-checkin__when">
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                    <span>〜</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                  </div>
                </div>
                <div className="org-checkin__field">
                  <span>参加対象</span>
                  <ul className="org-checkin__audience">
                    {CHECKIN_AUDIENCES.map((item) => (
                      <li key={item.id}>
                        <button type="button" className={cn(audience === item.id && "is-on")} onClick={() => setAudience(item.id)}>
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <label className="org-checkin__field org-checkin__field--wide">
                  <span>説明文</span>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={400} rows={3} />
                  <small>{description.length}/400</small>
                </label>
                <div className="org-checkin__field org-checkin__field--wide">
                  <span>カテゴリ・タグ</span>
                  <ul className="org-checkin__cats">
                    {CHECKIN_CATEGORIES.map((item) => (
                      <li key={item}>
                        <button type="button" className={cn(category === item && "is-on")} onClick={() => setCategory(item)}>
                          {item}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="org-checkin__tags">
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
                      placeholder="Enterで追加できます"
                    />
                  </div>
                </div>
                <div className="org-checkin__field org-checkin__field--wide">
                  <span>メイン画像</span>
                  <div className="org-checkin__main-image">
                    <Image src={mainImage} alt="" width={640} height={280} unoptimized />
                    <span>
                      <ImagePlus className="h-3.5 w-3.5" aria-hidden />
                      画像を変更
                    </span>
                  </div>
                  <ul className="org-checkin__thumbs">
                    {CHECKIN_SAMPLE_IMAGES.map((src) => (
                      <li key={src}>
                        <button type="button" className={cn(mainImage === src && "is-on")} onClick={() => setMainImage(src)}>
                          <Image src={src} alt="" width={80} height={56} unoptimized />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="org-checkin__field org-checkin__field--wide">
                  <span>チェックイン方式</span>
                  <ul className="org-checkin__methods">
                    {CHECKIN_METHODS.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={cn(defaultMethod === item.id && "is-on")}
                          onClick={() => setDefaultMethod(item.id)}
                        >
                          <MethodIcon method={item.id} />
                          <strong>{item.label}</strong>
                          <span>{item.blurb}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ) : null}

          {step === "spots" ? (
            <section className="org-checkin__card">
              <div className="org-checkin__card-head">
                <div>
                  <h2>
                    <span>2</span>
                    スポット設定
                  </h2>
                  <p>チェックインスポットを登録しましょう。上下ボタンで並び替えもできます。</p>
                </div>
                <button type="button" className="org-checkin__add" onClick={addSpot} disabled={spots.length >= 20}>
                  <Plus className="h-4 w-4" aria-hidden />
                  スポットを追加する
                </button>
              </div>
              <div className="org-checkin__spots-layout">
                <div>
                  {spots.length === 0 ? (
                    <p className="org-checkin__empty">まだスポットがありません。参加スポットを追加しましょう。</p>
                  ) : (
                    <div className="org-checkin__table-wrap">
                      <table className="org-checkin__table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>スポット名</th>
                            <th>場所</th>
                            <th>方法</th>
                            <th>設定値</th>
                            <th>特典</th>
                            <th>公開</th>
                            <th>操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {spots.map((spot, index) => (
                            <tr key={spot.key} className={cn(spot.key === editingKey && "is-on")}>
                              <td>{index + 1}</td>
                              <td>
                                <div className="org-checkin__spot-name">
                                  <Image src={spot.imageUrl} alt="" width={40} height={40} unoptimized />
                                  <strong>{spot.name.trim() || "新しいスポット"}</strong>
                                </div>
                              </td>
                              <td>{spot.place.trim() || "—"}</td>
                              <td>
                                <span className="org-checkin__method-chip">
                                  <MethodIcon method={spot.method} />
                                  {checkinMethodLabel(spot.method)}
                                </span>
                              </td>
                              <td>{checkinSpotValue(spot)}</td>
                              <td>{spot.reward.trim() || "—"}</td>
                              <td>
                                <button
                                  type="button"
                                  className={cn("org-checkin__switch", spot.published && "is-on")}
                                  onClick={() => updateSpot(spot.key, { published: !spot.published })}
                                  aria-pressed={spot.published}
                                >
                                  {spot.published ? "ON" : "OFF"}
                                </button>
                              </td>
                              <td>
                                <div className="org-checkin__row-actions">
                                  <button type="button" onClick={() => moveSpot(spot.key, -1)} aria-label="上へ">
                                    <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                                  </button>
                                  <button type="button" onClick={() => moveSpot(spot.key, 1)} aria-label="下へ">
                                    <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                                  </button>
                                  <button type="button" onClick={() => setEditingKey(spot.key === editingKey ? null : spot.key)}>
                                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                                  </button>
                                  <button type="button" onClick={() => setSpots((current) => current.filter((item) => item.key !== spot.key))}>
                                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {editing ? (
                    <div className="org-checkin__editor">
                      <label>
                        スポット名
                        <input value={editing.name} onChange={(e) => updateSpot(editing.key, { name: e.target.value })} />
                      </label>
                      <label>
                        場所 / 住所
                        <input value={editing.place} onChange={(e) => updateSpot(editing.key, { place: e.target.value })} />
                      </label>
                      <label>
                        チェックイン方法
                        <select
                          value={editing.method}
                          onChange={(e) => updateSpot(editing.key, { method: e.target.value as CheckinMethod })}
                        >
                          {CHECKIN_METHODS.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      {editing.method === "gps" ? (
                        <label>
                          半径（m）
                          <input
                            type="number"
                            min={10}
                            max={500}
                            value={editing.radius}
                            onChange={(e) => updateSpot(editing.key, { radius: Number(e.target.value) || 50 })}
                          />
                        </label>
                      ) : null}
                      {editing.method === "keyword" ? (
                        <label>
                          キーワード
                          <input value={editing.keyword} onChange={(e) => updateSpot(editing.key, { keyword: e.target.value })} />
                        </label>
                      ) : null}
                      <label>
                        特典
                        <input value={editing.reward} onChange={(e) => updateSpot(editing.key, { reward: e.target.value })} />
                      </label>
                      <div>
                        <span>スポット画像</span>
                        <ul className="org-checkin__thumbs">
                          {CHECKIN_SAMPLE_IMAGES.map((src) => (
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
                </div>
                <aside className="org-checkin__map-card">
                  <p>スポットの配置を確認</p>
                  <div className="org-checkin__map" aria-hidden>
                    {namedSpots.map((spot, index) => (
                      <button
                        key={spot.key}
                        type="button"
                        className={cn("org-checkin__pin", spot.key === editingKey && "is-on")}
                        style={{ left: `${spot.pinX}%`, top: `${spot.pinY}%` }}
                        onClick={() => setEditingKey(spot.key)}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                  <div className="org-checkin__tips">
                    <p>おすすめの設定方法</p>
                    <ul>
                      <li>
                        <MapPin className="h-3.5 w-3.5" aria-hidden />
                        GPSチェックイン：半径50〜100mが扱いやすいです
                      </li>
                      <li>
                        <QrCode className="h-3.5 w-3.5" aria-hidden />
                        QRコードチェックイン：看板やポスターにQRを設置します
                      </li>
                      <li>
                        <KeyRound className="h-3.5 w-3.5" aria-hidden />
                        キーワードチェックイン：現地の看板に記載の言葉を設定します
                      </li>
                    </ul>
                  </div>
                </aside>
              </div>
            </section>
          ) : null}

          {step === "rewards" ? (
            <section className="org-checkin__card">
              <h2>
                <span>3</span>
                達成条件
              </h2>
              <p>どのくらいチェックインすると、ゲームクリアになるかを設定しましょう。</p>
              <ul className="org-checkin__clears">
                {CHECKIN_CLEAR_MODES.map((mode) => (
                  <li key={mode.id}>
                    <button type="button" className={cn(clearMode === mode.id && "is-on")} onClick={() => setClearMode(mode.id)}>
                      <strong>
                        {mode.id === "count"
                          ? `${Math.min(clearCount, Math.max(namedSpots.length, 1))}スポット以上でクリア`
                          : mode.id === "any"
                            ? `好きな順で${Math.min(clearCount, Math.max(namedSpots.length, 1))}スポット以上`
                            : mode.label}
                      </strong>
                      <span>{mode.blurb}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {clearMode !== "all" ? (
                <label className="org-checkin__field">
                  <span>必要なスポット数</span>
                  <select value={clearCount} onChange={(e) => setClearCount(Number(e.target.value))}>
                    {Array.from({ length: Math.max(namedSpots.length, 1) }, (_, index) => index + 1).map((count) => (
                      <option key={count} value={count}>
                        {count}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <h2 className="org-checkin__subhead">
                <span>2</span>
                特典設定
              </h2>
              <p>ゲームクリア時にもらえる特典を設定します。複数の特典を組み合わせることもできます。</p>
              <ul className="org-checkin__rewards">
                <li>
                  <Gift className="h-4 w-4" aria-hidden />
                  クーポン付与
                  <button type="button" className={cn("org-checkin__switch", couponOn && "is-on")} onClick={() => setCouponOn((v) => !v)}>
                    {couponOn ? "ON" : "OFF"}
                  </button>
                </li>
                <li>
                  <Users className="h-4 w-4" aria-hidden />
                  ポイント付与
                  <button type="button" className={cn("org-checkin__switch", pointsOn && "is-on")} onClick={() => setPointsOn((v) => !v)}>
                    {pointsOn ? "ON" : "OFF"}
                  </button>
                </li>
                <li>
                  デジタルスタンプ
                  <button type="button" className={cn("org-checkin__switch", stampOn && "is-on")} onClick={() => setStampOn((v) => !v)}>
                    {stampOn ? "ON" : "OFF"}
                  </button>
                </li>
                <li>
                  景品引換
                  <button type="button" className={cn("org-checkin__switch", prizeOn && "is-on")} onClick={() => setPrizeOn((v) => !v)}>
                    {prizeOn ? "ON" : "OFF"}
                  </button>
                </li>
              </ul>
              {couponOn ? (
                <div className="org-checkin__grid">
                  <label className="org-checkin__field">
                    <span>クーポンの名称</span>
                    <input value={couponName} onChange={(e) => setCouponName(e.target.value)} maxLength={40} />
                  </label>
                  <label className="org-checkin__field org-checkin__field--wide">
                    <span>クーポン内容</span>
                    <textarea value={couponDetail} onChange={(e) => setCouponDetail(e.target.value)} maxLength={80} rows={2} />
                  </label>
                </div>
              ) : null}
              {pointsOn ? (
                <label className="org-checkin__field">
                  <span>付与ポイント</span>
                  <input type="number" min={0} max={9999} value={points} onChange={(e) => setPoints(Number(e.target.value) || 0)} />
                </label>
              ) : null}
              <div className="org-checkin__grid">
                <label className="org-checkin__field">
                  <span>受け取り方法・場所</span>
                  <select value={receivePlace} onChange={(e) => setReceivePlace(e.target.value === "venue" ? "venue" : "app")}>
                    <option value="app">参加者のマイページで受け取り</option>
                    <option value="venue">会場で受け取り</option>
                  </select>
                </label>
                <label className="org-checkin__field">
                  <span>配布上限数</span>
                  <input type="number" min={0} max={99999} value={maxCount} onChange={(e) => setMaxCount(Number(e.target.value) || 0)} />
                </label>
              </div>
              <label className="org-checkin__check">
                <input type="checkbox" checked={rankingOn} onChange={(e) => setRankingOn(e.target.checked)} />
                ランキング表示
              </label>
              <label className="org-checkin__check">
                <input type="checkbox" checked={hintOn} onChange={(e) => setHintOn(e.target.checked)} />
                ヒントの表示
              </label>
            </section>
          ) : null}

          {step === "publish" ? (
            <section className="org-checkin__card">
              <div className="org-checkin__card-head">
                <div>
                  <h2>
                    <span>4</span>
                    確認・公開
                  </h2>
                  <p>設定した内容に間違いがないか確認し、公開設定を行いましょう。</p>
                </div>
                {checks.every((item) => item.ok) ? <em className="org-checkin__ready">すべての必須項目が設定されています</em> : null}
              </div>
              <div className="org-checkin__summary">
                <article>
                  <header>
                    <h3>基本情報</h3>
                    <button type="button" onClick={() => setStep("basic")}>
                      編集
                    </button>
                  </header>
                  <dl>
                    <div>
                      <dt>ゲーム名</dt>
                      <dd>{name.trim() || "未入力"}</dd>
                    </div>
                    <div>
                      <dt>対象イベント</dt>
                      <dd>{eventTitle}</dd>
                    </div>
                    <div>
                      <dt>開催期間</dt>
                      <dd>{periodLabel ?? "未設定"}</dd>
                    </div>
                    <div>
                      <dt>説明文</dt>
                      <dd>{description.trim() || "未入力"}</dd>
                    </div>
                  </dl>
                </article>
                <article>
                  <header>
                    <h3>スポット設定</h3>
                    <button type="button" onClick={() => setStep("spots")}>
                      編集
                    </button>
                  </header>
                  <p>
                    スポット数 {namedSpots.length} / {spots.length} スポット
                  </p>
                  <ul>
                    {namedSpots.slice(0, 3).map((spot) => (
                      <li key={spot.key}>{spot.name}</li>
                    ))}
                  </ul>
                </article>
                <article>
                  <header>
                    <h3>チェックイン方式</h3>
                    <button type="button" onClick={() => setStep("basic")}>
                      編集
                    </button>
                  </header>
                  <p>
                    {checkinMethodLabel(defaultMethod)}チェックイン
                    <span>指定のスポットに近づいてチェックイン</span>
                  </p>
                </article>
                <article>
                  <header>
                    <h3>達成条件・特典</h3>
                    <button type="button" onClick={() => setStep("rewards")}>
                      編集
                    </button>
                  </header>
                  <dl>
                    <div>
                      <dt>達成条件</dt>
                      <dd>{clearLabel}</dd>
                    </div>
                    <div>
                      <dt>達成特典</dt>
                      <dd>
                        {[couponOn ? couponName || "クーポン" : null, pointsOn ? `${points}ポイント` : null, stampOn ? "スタンプ" : null]
                          .filter(Boolean)
                          .join(" / ") || "未設定"}
                      </dd>
                    </div>
                  </dl>
                </article>
                <article className="org-checkin__publish-card">
                  <header>
                    <h3>公開設定</h3>
                  </header>
                  <label className="org-checkin__check">
                    <input type="checkbox" checked={publicToPlayers} onChange={(e) => setPublicToPlayers(e.target.checked)} />
                    参加者に公開する
                  </label>
                  <label className="org-checkin__check">
                    <input type="checkbox" checked={showOnEvent} onChange={(e) => setShowOnEvent(e.target.checked)} />
                    イベントページに表示する
                  </label>
                  <label className="org-checkin__check">
                    <input type="checkbox" checked={showRanking} onChange={(e) => setShowRanking(e.target.checked)} />
                    ランキングを表示する
                  </label>
                </article>
              </div>
              <ul className="org-checkin__checks">
                {checks.map((item) => (
                  <li key={item.label} className={cn(item.ok && "is-ok")}>
                    <Check className="h-3.5 w-3.5" aria-hidden />
                    {item.label}
                  </li>
                ))}
              </ul>
              <label className="org-checkin__check org-checkin__confirm">
                <input type="checkbox" checked={confirmOk} onChange={(e) => setConfirmOk(e.target.checked)} />
                上記の内容で問題ありません。このゲームを参加者に公開します。
              </label>
            </section>
          ) : null}

          {error ? <p className="org-checkin__error">{error}</p> : null}

          <div className="org-checkin__footer">
            {stepIndex > 0 ? (
              <button type="button" className="org-checkin__ghost" onClick={goPrev}>
                前のステップへ
              </button>
            ) : null}
            <button type="button" className="org-checkin__ghost" disabled={saving} onClick={() => void save("draft")}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              下書き保存
            </button>
            {stepIndex < STEPS.length - 1 ? (
              <button type="button" className="org-checkin__next" onClick={goNext}>
                保存して次へ
              </button>
            ) : (
              <button type="button" className="org-checkin__next" disabled={saving} onClick={() => void save("published")}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Share2 className="h-4 w-4" aria-hidden />}
                公開する
              </button>
            )}
          </div>
        </div>

        <OrganizerCheckinPreview
          name={name}
          description={description}
          coverImage={mainImage}
          spots={spots}
          clearMode={clearMode}
          clearCount={clearCount}
          couponOn={couponOn}
          couponName={couponName}
          couponDetail={couponDetail}
          pointsOn={pointsOn}
          points={points}
          stampOn={stampOn}
          rankingOn={rankingOn}
          tab={previewTab}
          onTab={setPreviewTab}
        />
      </div>
    </div>
  );
}
