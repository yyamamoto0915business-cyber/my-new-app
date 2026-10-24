"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  Coins,
  Trophy,
  ChevronUp,
  Gift,
  ImagePlus,
  KeyRound,
  MapPin,
  Pencil,
  Plus,
  QrCode,
  Trash2,
  Users,
  PenLine,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { OrganizerGameEventOption } from "@/lib/organizer/games";
import {
  CHECKIN_CATEGORIES,
  CHECKIN_CLEAR_MODES,
  CHECKIN_METHODS,
  CHECKIN_SAMPLE_IMAGES,
  checkinClearLabel,
  checkinMethodLabel,
  checkinSpotValue,
  createCheckinSpot,
  sampleCheckinSpots,
  sanitizeCheckinSettings,
  type CheckinAudience,
  type CheckinCategory,
  type CheckinClearMode,
  type CheckinMethod,
  type CheckinSpot,
} from "@/lib/organizer/checkin";
import { CheckinTestPlay } from "@/components/organizer/games/CheckinTestPlay";
import { GamePhonePreview } from "@/components/organizer/games/GamePhonePreview";
import { RewardFields } from "@/components/organizer/games/RewardFields";
import { ClearCountCard, RewardCard, RewardList } from "@/components/organizer/games/RewardOptions";
import { PlacePickerDialog } from "@/components/organizer/games/PlacePickerDialog";
import { PeriodPresets, jstDate, periodProblem } from "@/components/organizer/games/PeriodPresets";
import { AudienceField, type GameAudienceChoice } from "@/components/organizer/games/AudienceField";
import { useGameLookEdit } from "@/components/organizer/games/useGameLookEdit";
import { GameCreateShell, type GameCreateStep } from "@/components/organizer/games/GameCreateShell";
import { GameCardSetup, gameCardItem } from "@/components/organizer/games/GameCardSetup";
import { GamePublishSuccess } from "@/components/organizer/games/GamePublishSuccess";
import { GameDraftLoading } from "@/components/organizer/games/GameDraftLoading";
import { useGameDraft } from "@/components/organizer/games/useGameDraft";
import { readGameLook } from "@/lib/organizer/game-look";

const STEPS = [
  { id: "basic", label: "基本設定" },
  { id: "spots", label: "スポット設定" },
  { id: "rewards", label: "達成条件・特典" },
  { id: "publish", label: "確認・公開" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const SHELL_STEPS: GameCreateStep[] = [
  { label: STEPS[0].label, icon: PenLine },
  { label: STEPS[1].label, icon: MapPin },
  { label: STEPS[2].label, icon: Gift },
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
  const { look, lookEdit, setLook } = useGameLookEdit();
  const router = useRouter();
  const [step, setStep] = useState<StepId>("basic");
  const [name, setName] = useState("春のまち歩きチェックイン");
  const [description, setDescription] = useState(
    "まちのスポットをめぐってチェックインしながら、春のまちの魅力を発見しましょう！すべてのスポットを巡って、素敵な特典をゲットしよう！"
  );
  const [eventId, setEventId] = useState("");
  /** まちの情報のカードに出す画像（空なら、対象イベントの画像 → 種類の絵）。 */
  const [cardImage, setCardImage] = useState("");
  // はじめは今日から1か月（過去の日付から始めない）。
  const [startDate, setStartDate] = useState(() => jstDate());
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState(() => jstDate(29));
  const [endTime, setEndTime] = useState("18:00");
  const [events, setEvents] = useState<OrganizerGameEventOption[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [mainImage, setMainImage] = useState<(typeof CHECKIN_SAMPLE_IMAGES)[number]>(CHECKIN_SAMPLE_IMAGES[0]);
  const [category, setCategory] = useState<CheckinCategory>("まち歩き");
  const [tags, setTags] = useState<string[]>(["まち歩き", "観光"]);
  const [tagDraft, setTagDraft] = useState("");
  /** 参加できる人（ゲーム共通の設定。参加者の画面での確かめに使う）。 */
  const [gameAudience, setGameAudience] = useState<GameAudienceChoice>("anyone");
  // チェックイン独自の参加対象は使っていない（保存の形だけ残す）。
  const audience: CheckinAudience = "anyone";
  const [defaultMethod, setDefaultMethod] = useState<CheckinMethod>("gps");
  const [spots, setSpots] = useState<CheckinSpot[]>(() => sampleCheckinSpots());
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [clearMode, setClearMode] = useState<CheckinClearMode>("count");
  const [clearCount, setClearCount] = useState(3);
  const [couponOn, setCouponOn] = useState(true);
  const [pointsOn, setPointsOn] = useState(true);
  // デジタルスタンプ・受け取り方法・配布上限は、参加者の画面では使っていない（保存の形だけ残す）。
  const stampOn = false;
  const [prizeOn, setPrizeOn] = useState(false);
  const [couponName, setCouponName] = useState("まち歩き応援クーポン");
  const [couponDetail, setCouponDetail] = useState("対象店舗で使える 10%OFF クーポンです。まち歩きのあと、ぜひお立ち寄りください！");
  const [prizeName, setPrizeName] = useState("");
  const [prizePlace, setPrizePlace] = useState("");
  const [placePickKey, setPlacePickKey] = useState<string | null>(null);
  const [points, setPoints] = useState(100);
  const receivePlace: "app" | "venue" = "app";
  const maxCount = 500;
  const [rankingOn, setRankingOn] = useState(true);
  const [hintOn, setHintOn] = useState(true);
  const [publicToPlayers, setPublicToPlayers] = useState(true);
  const showOnEvent = false;
  // ランキングの表示は「達成条件・特典」のスイッチと同じにする。
  const showRanking = rankingOn;
  const [confirmOk, setConfirmOk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const draft = useGameDraft((saved) => {
    setName(saved.name);
    setDescription(saved.description);
    setEventId(saved.eventId);
    if (saved.startDate) setStartDate(saved.startDate);
    if (saved.endDate) setEndDate(saved.endDate);
    if (saved.startTime) setStartTime(saved.startTime);
    if (saved.endTime) setEndTime(saved.endTime);
    setCardImage(typeof saved.settings.cardImage === "string" ? saved.settings.cardImage : "");
    const savedAudience = saved.settings.audience;
    setGameAudience(savedAudience === "event" || savedAudience === "pass" ? savedAudience : "anyone");
    if (saved.settings.look) setLook(readGameLook(saved.settings.look));
    const checkin = sanitizeCheckinSettings(saved.settings.checkin);
    if (!checkin) return;
    if (checkin.spots.length > 0) setSpots(checkin.spots.map((spot) => ({ ...spot, key: crypto.randomUUID() })));
    const savedImage = CHECKIN_SAMPLE_IMAGES.find((image) => image === checkin.mainImage);
    if (savedImage) setMainImage(savedImage);
    const savedCategory = CHECKIN_CATEGORIES.find((item) => item === checkin.category);
    if (savedCategory) setCategory(savedCategory);
    setTags(checkin.tags);
    setDefaultMethod(checkin.defaultMethod);
    setClearMode(checkin.clearMode);
    setClearCount(checkin.clearCount);
    setCouponOn(checkin.couponOn);
    setPointsOn(checkin.pointsOn);
    setPrizeOn(checkin.prizeOn);
    setCouponName(checkin.couponName);
    setCouponDetail(checkin.couponDetail);
    setPrizeName(checkin.prizeName);
    setPrizePlace(checkin.prizePlace);
    setPoints(checkin.points);
    setRankingOn(checkin.rankingOn);
    setHintOn(checkin.hintOn);
    setPublicToPlayers(checkin.publicToPlayers);
  });

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
    if (id === "basic") {
      const problem = periodProblem(startDate, endDate);
      if (problem) return problem;
    }
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
    goTo(STEPS[Math.min(stepIndex + 1, STEPS.length - 1)].id);
  }

  function goTo(id: StepId) {
    setStep(id);
  }


  /** 保存で送る設定。プレビューも同じものから描く。 */
  const settingsBody = {
    spots: spots.map(({ key: _key, ...spot }) => spot),
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
    prizeName,
    prizePlace,
    points,
    receivePlace,
    maxCount,
    rankingOn,
    hintOn,
    publicToPlayers,
    showOnEvent,
    showRanking,
  };

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
      const result = await draft.saveGame(
        {
          name: name.trim(),
          type: "checkin",
          eventId: eventId || null,
          cardImage,
          audience: gameAudience,
          description: description.trim(),
          startsAt: toIsoFromDateTime(startDate, startTime),
          endsAt: toIsoFromDateTime(endDate, endTime),
          spots: namedSpots.map((spot) => ({ name: spot.name.trim(), kind: "stamp" })),
          checkin: settingsBody,
          look,
        },
        status,
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (status === "published") {
        setPublished(true);
        return;
      }
      router.push(`/organizer/games/${result.id}`);
    } finally {
      setSaving(false);
    }
  }

  const checks = [
    { ok: Boolean(name.trim() && description.trim() && startDate && endDate), label: "ゲームの基本情報が設定されています" },
    { ok: namedSpots.length > 0, label: "スポットが1つ以上設定されています" },
    { ok: namedSpots.every((spot) => spot.method), label: "チェックイン方法が設定されています" },
    { ok: Boolean(clearMode), label: "達成条件・特典が設定されています" },
    { ok: publicToPlayers, label: "公開設定が完了しています" },
  ];

  if (draft.loading || draft.loadError) return <GameDraftLoading error={draft.loadError} />;

  if (published) {
    return (
      <div className="org-checkin">
        <GamePublishSuccess
          typeLabel="チェックイン"
          card={gameCardItem({
            type: "checkin",
            typeLabel: "チェックイン",
            name,
            startDate: startDate,
            event: events.find((item) => item.id === eventId) ?? null,
            cardImage,
          })}
        />
      </div>
    );
  }

  return (
    <GameCreateShell
      title="チェックイン作成"
      subtitle="スポットに来てチェックインする、回遊型の体験をかんたん作成しましょう。"
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
          kind="checkin"
          typeLabel="チェックイン"
          name={name}
          description={description}
          settings={settingsBody}
          look={lookEdit}
          stepView={stepIndex === 0 ? "start" : stepIndex === STEPS.length - 1 ? "clear" : "play"}
        />
      }
    >
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
                    <input type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} />
                    <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                  </div>
                  <PeriodPresets startDate={startDate} endDate={endDate} onStart={setStartDate} onEnd={setEndDate} />
                </div>
                <div className="org-checkin__field org-checkin__field--wide">
                  <AudienceField value={gameAudience} onChange={setGameAudience} eventChosen={Boolean(eventId)} />
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
                        <>
                          {/* 位置情報スタンプラリーと同じ。地図で場所を選ぶと、その半径の中にいるときだけ記録できる。 */}
                          <button
                            type="button"
                            onClick={() => setPlacePickKey(editing.key)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "0.35rem",
                              minHeight: "2.6rem",
                              padding: "0 1rem",
                              border: editing.lat != null ? "1.5px solid #b7e4c4" : "1.5px dashed #e6a23c",
                              borderRadius: 999,
                              background: editing.lat != null ? "#eef7f1" : "#fff8e8",
                              color: editing.lat != null ? "#1f7a4a" : "#8a5a00",
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            <MapPin className="h-4 w-4" aria-hidden />
                            {editing.lat != null ? "地図の場所OK・変更" : "地図で場所を選ぶ"}
                          </button>
                          {editing.lat == null ? (
                            <small style={{ color: "#c0392b" }}>場所を選ぶまでは、押すだけで記録されます。</small>
                          ) : null}
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
                          {placePickKey === editing.key ? (
                            <PlacePickerDialog
                              title={`「${editing.name.trim() || "このスポット"}」の場所`}
                              value={editing.lat != null && editing.lng != null ? { lat: editing.lat, lng: editing.lng } : null}
                              onPick={(place) => updateSpot(editing.key, { lat: place?.lat ?? null, lng: place?.lng ?? null })}
                              onClose={() => setPlacePickKey(null)}
                            />
                          ) : null}
                        </>
                      ) : null}
                      {editing.method === "qr" ? (
                        <small style={{ color: "#8a5a00", background: "#fff4dc", padding: "0.5rem 0.65rem", borderRadius: "0.6rem" }}>
                          QRの読み取りは準備中です。いまは押すだけで記録されます。確かめたい場合は「キーワード」か「GPS」を選んでください。
                        </small>
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
                達成条件・特典
              </h2>
              <p>どのくらいチェックインするとクリアか、クリアした人への特典を決めます。</p>
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
              <RewardList>
                {clearMode !== "all" ? (
                  <ClearCountCard
                    icon={Trophy}
                    title={`${Math.min(clearCount, Math.max(namedSpots.length, 1))}スポットでクリア`}
                    desc="スポットの数までの中から選べます"
                    value={Math.min(clearCount, Math.max(namedSpots.length, 1))}
                    max={namedSpots.length}
                    unit="スポット"
                    onChange={setClearCount}
                  />
                ) : null}
                <p style={{ margin: "0.5rem 0 0", fontSize: "0.78rem", fontWeight: 800, color: "#3c4a40" }}>クリアした人への特典</p>
                <RewardCard icon={Coins} title="ポイント" desc="クリアした人のアカウントに、ポイントを加えます" on={pointsOn} onChange={setPointsOn}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78rem", fontWeight: 800, color: "#3c4a40" }}>
                    もらえるポイント
                    <input
                      type="number"
                      min={1}
                      max={9999}
                      value={points}
                      onChange={(e) => setPoints(Number(e.target.value) || 0)}
                      style={{ width: "5.5rem", minHeight: "2.1rem", padding: "0 0.6rem", border: "1.5px solid #dfe7e1", borderRadius: "0.6rem", background: "#fff" }}
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
                      { label: "クーポンの名前", value: couponName, onChange: setCouponName, max: 40, placeholder: "例：まち歩き応援クーポン" },
                      { label: "内容・使い方", value: couponDetail, onChange: setCouponDetail, max: 80, placeholder: "例：対象店舗で 10%OFF" },
                    ]}
                    note="使ったかどうかは、ゲームの管理画面で記録できます。"
                  />
                </RewardCard>
                <RewardCard icon={Gift} title="景品引換" desc="クリアした人が、現地で景品と引き換えられます" on={prizeOn} onChange={setPrizeOn}>
                  <RewardFields
                    fields={[
                      { label: "景品の名前", value: prizeName, onChange: setPrizeName, max: 40, placeholder: "例：オリジナル手ぬぐい" },
                      { label: "受け取り場所", value: prizePlace, onChange: setPrizePlace, max: 60, placeholder: "例：駅前の観光案内所" },
                    ]}
                    note="引き換えコードを出します。渡したら、管理画面で引き換え済みにできます。"
                  />
                </RewardCard>
                <p style={{ margin: "0.5rem 0 0", fontSize: "0.78rem", fontWeight: 800, color: "#3c4a40" }}>表示</p>
                <RewardCard
                  icon={Trophy}
                  title="ランキング表示"
                  desc="クリアした人に順位を見せます（記録した数が多い順、同じなら早くクリアした人が上）"
                  on={rankingOn}
                  onChange={setRankingOn}
                />
                <RewardCard
                  icon={MapPin}
                  title="場所のヒントを出す"
                  desc="参加者の画面に、スポットの場所・住所を出します"
                  on={hintOn}
                  onChange={setHintOn}
                />
                <div style={{ opacity: 0.6 }}>
                  <RewardCard
                    icon={Users}
                    title="配布の上限（準備中）"
                    desc="いまは上限なく配られます。上限の設定は、このあと追加します。"
                    on={false}
                    onChange={() => undefined}
                  />
                </div>
              </RewardList>
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
                  <label className="org-checkin__check" style={{ opacity: 0.6 }}>
                    <input type="checkbox" checked={false} disabled readOnly />
                    イベントページに表示する（準備中）
                  </label>
                  <p style={{ margin: 0, fontSize: "0.72rem", color: "#6a7568" }}>ランキングの表示は、「達成条件・特典」で切り替えられます。</p>
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
              <GameCardSetup
                type="checkin"
                typeLabel="チェックイン"
                name={name}
                startDate={startDate}
                event={events.find((item) => item.id === eventId) ?? null}
                cardImage={cardImage}
                onCardImage={setCardImage}
              />
            </section>
          ) : null}
      {testing ? (
        <CheckinTestPlay
          name={name}
          description={description}
          spots={spots}
          clearMode={clearMode}
          clearCount={clearCount}
          couponOn={couponOn}
          couponName={couponName}
          pointsOn={pointsOn}
          points={points}
          stampOn={stampOn}
          prizeOn={prizeOn}
          receivePlace={receivePlace}
          onClose={() => setTesting(false)}
        />
      ) : null}
    </GameCreateShell>
  );
}
