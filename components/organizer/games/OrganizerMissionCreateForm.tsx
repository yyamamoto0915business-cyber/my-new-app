"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  CircleHelp,
  Copy,
  Flag,
  ChevronDown,
  ChevronUp,
  Gift,
  KeyRound,
  MapPin,
  Pencil,
  PenLine,
  Plus,
  Rocket,
  Sparkles,
  Stamp,
  Trash2,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { OrganizerGameEventOption } from "@/lib/organizer/games";
import {
  MISSION_KINDS,
  createMissionItem,
  MISSION_PLACE_KINDS,
  missionKindLabel,
  missionRewardLabel,
  sampleMissions,
  type MissionItem,
  type MissionKindId,
  type MissionReward,
} from "@/lib/organizer/mission";
import { MissionTestPlay } from "@/components/organizer/games/MissionTestPlay";
import { GamePhonePreview } from "@/components/organizer/games/GamePhonePreview";
import { ArrivalFields } from "@/components/organizer/games/ArrivalFields";
import { useGameLookEdit } from "@/components/organizer/games/useGameLookEdit";
import { GameCreateShell, type GameCreateStep } from "@/components/organizer/games/GameCreateShell";
import { GamePublishSuccess } from "@/components/organizer/games/GamePublishSuccess";

const KIND_ICONS: Record<MissionKindId, LucideIcon> = {
  visit: MapPin,
  photo: Camera,
  keyword: KeyRound,
  checkin: Flag,
  quiz: CircleHelp,
  friends: Users,
};

const REWARD_OPTIONS: { id: "coupon" | "points" | "stamp"; label: string; blurb: string }[] = [
  { id: "coupon", label: "クーポン付与", blurb: "クリア時にクーポンをプレゼント" },
  { id: "points", label: "ポイント付与", blurb: "クリア時にポイントを付与" },
  { id: "stamp", label: "スタンプラリー", blurb: "スタンプを集める達成にします" },
];

const STEPS: GameCreateStep[] = [
  { label: "基本情報", icon: PenLine },
  { label: "ミッション形式", icon: Sparkles },
  { label: "ミッション", icon: Flag },
  { label: "達成条件・特典", icon: Gift },
  { label: "公開設定", icon: Rocket },
];

/** 日本時間の今日から days 日あとの日付（YYYY-MM-DD）。 */
function jstDate(days = 0, from?: string): string {
  const base = from ? new Date(`${from}T00:00:00+09:00`) : new Date();
  const value = new Date(base.getTime() + days * 86400000);
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(value);
}

/** よく使う開催期間。開始日から数える。 */
const PERIOD_PRESETS = [
  { label: "1日", days: 0 },
  { label: "1週間", days: 6 },
  { label: "1か月", days: 29 },
  { label: "3か月", days: 89 },
];

/** 開いたカードの中の編集欄を、スマホでも縦に長くならないよう詰める。 */
const OPEN_CARD_CSS = `
.mission-open .org-mission__editor { margin: 0; padding: 0; border: 0; background: none; gap: 0.45rem; }
.mission-open .org-mission__editor h3 { display: none; }
.mission-open .org-mission__editor label { gap: 0.15rem; font-size: 0.8rem; }
.mission-open .org-mission__editor input:not([type="radio"]),
.mission-open .org-mission__editor select,
.mission-open .org-mission__editor textarea { min-height: 2.4rem; padding-top: 0.3rem; padding-bottom: 0.3rem; }
.mission-open .org-mission__editor-row { grid-template-columns: 1.3fr 1fr 0.8fr !important; gap: 0.4rem; }
.mission-open .quiz-checkpoint { gap: 0.45rem; padding: 0.55rem; }
.mission-open .quiz-checkpoint__arrivals button { padding: 0.4rem 0.5rem; }
.mission-open .quiz-checkpoint__arrivals em { display: none; }
`;

/** カードに出す「まだ足りないもの」。なければ null。 */
function missionTodo(mission: MissionItem): string | null {
  if (!mission.name.trim()) return "名前が未入力";
  if ((mission.kind === "visit" || mission.kind === "checkin") && mission.arrival === "gps" && (mission.lat == null || mission.lng == null)) {
    return "場所が未設定";
  }
  if ((mission.kind === "visit" || mission.kind === "checkin") && mission.arrival === "keyword" && !mission.keyword.trim()) {
    return "合言葉が未入力";
  }
  if (mission.kind === "quiz" && (!mission.question.trim() || mission.choices.filter((choice) => choice.trim()).length < 2)) {
    return "問題が未入力";
  }
  return null;
}

function toIsoFromDate(date: string): string | null {
  if (!date) return null;
  const value = new Date(`${date}T00:00:00+09:00`);
  if (Number.isNaN(value.getTime())) return null;
  return value.toISOString();
}

export function OrganizerMissionCreateForm() {
  const { look, lookEdit } = useGameLookEdit();
  const router = useRouter();
  const [name, setName] = useState("まち巡り発見ミッション ～春のまちなかさんぽ～");
  const [eventId, setEventId] = useState("");
  const [description, setDescription] = useState(
    "まちなかを巡って、スポットを発見したり、写真を撮ったり、クイズに挑戦しながら、このまちの魅力を再発見できるミッションゲームです。"
  );
  // はじめは今日から1か月（過去の日付から始めない）。
  const [startDate, setStartDate] = useState(() => jstDate());
  const [endDate, setEndDate] = useState(() => jstDate(29));
  const [events, setEvents] = useState<OrganizerGameEventOption[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [formats, setFormats] = useState<MissionKindId[]>(MISSION_KINDS.map((kind) => kind.id));
  const [missions, setMissions] = useState<MissionItem[]>(() => sampleMissions());
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [clearCount, setClearCount] = useState(3);
  const [couponOn, setCouponOn] = useState(true);
  const [pointsOn, setPointsOn] = useState(false);
  const [stampOn, setStampOn] = useState(false);
  const [prizePlace, setPrizePlace] = useState("中央観光案内所");
  // 参加パスは準備中。つなぎこむまでは、いつもオフで保存する。
  const passOnly = false;
  const [rankingOn, setRankingOn] = useState(true);
  const [hintsOn, setHintsOn] = useState(true);
  const [step, setStep] = useState(0);
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

  const eventHint = useMemo(() => {
    if (loadingEvents) return "イベントを読み込み中です";
    if (events.length === 0) return "先にイベントを掲載すると、対象を選べます";
    return null;
  }, [loadingEvents, events.length]);

  const editing = missions.find((mission) => mission.key === editingKey) ?? null;
  const periodError =
    !startDate || !endDate ? "開催期間の開始日と終了日を入れてください" : endDate < startDate ? "終了日は開始日より後にしてください" : null;
  const periodDays =
    startDate && endDate && !periodError
      ? Math.round((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86400000) + 1
      : 0;
  const clearOptions = Math.max(missions.length, clearCount, 1);

  function toggleFormat(id: MissionKindId) {
    setFormats((current) => {
      if (current.includes(id)) {
        if (current.length === 1) return current;
        return current.filter((item) => item !== id);
      }
      return [...current, id];
    });
  }

  function addMission() {
    const kind = formats[0] ?? "visit";
    const next = createMissionItem(kind);
    setMissions((current) => [...current, next]);
    setEditingKey(next.key);
  }

  function duplicateMission(key: string) {
    const source = missions.find((mission) => mission.key === key);
    if (!source) return;
    const copy: MissionItem = { ...source, key: crypto.randomUUID() };
    const index = missions.findIndex((mission) => mission.key === key);
    setMissions((current) => {
      const next = [...current];
      next.splice(index + 1, 0, copy);
      return next;
    });
  }

  function moveMission(key: string, delta: number) {
    setMissions((current) => {
      const index = current.findIndex((mission) => mission.key === key);
      const to = index + delta;
      if (index < 0 || to < 0 || to >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(to, 0, item!);
      return next;
    });
  }

  function removeMission(key: string) {
    setMissions((current) => current.filter((mission) => mission.key !== key));
    if (editingKey === key) setEditingKey(null);
  }

  function updateMission(key: string, patch: Partial<MissionItem>) {
    setMissions((current) =>
      current.map((mission) => (mission.key === key ? { ...mission, ...patch } : mission))
    );
  }

  /** 保存で送る設定。プレビューも同じものから描く。 */
  const settingsBody = {
    formats,
    missions: missions.map(({ key: _key, ...mission }) => mission),
    clearCount,
    rewards: { coupon: couponOn, points: pointsOn, stamp: stampOn },
    prizePlace,
    publish: { passOnly, ranking: rankingOn, hints: hintsOn },
  };

  async function save(status: "draft" | "published") {
    if (!name.trim()) {
      setError("ゲーム名を入力してください");
      return;
    }
    if (periodError) {
      setError(periodError);
      setStep(0);
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
          type: "mission",
          eventId: eventId || null,
          description: description.trim(),
          startsAt: toIsoFromDate(startDate),
          endsAt: toIsoFromDate(endDate),
          status,
          mission: settingsBody,
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
      <div className="org-mission">
        <GamePublishSuccess typeLabel="ミッション" />
      </div>
    );
  }

  /** 開いているミッションの編集欄（一覧のそのカードの下に出す）。 */
  const editorNode = editing ? (
              <div className="org-mission__editor">
                <h3>ミッションを編集</h3>
                <label>
                  ミッション名
                  <input
                    value={editing.name}
                    maxLength={40}
                    onChange={(e) => updateMission(editing.key, { name: e.target.value })}
                  />
                </label>
                <div className="org-mission__editor-row">
                  <label>
                    種類
                    <select
                      value={editing.kind}
                      onChange={(e) => updateMission(editing.key, { kind: e.target.value as MissionKindId })}
                    >
                      {MISSION_KINDS.filter((kind) => formats.includes(kind.id) || kind.id === editing.kind).map(
                        (kind) => (
                          <option key={kind.id} value={kind.id}>
                            {kind.label}
                          </option>
                        )
                      )}
                    </select>
                  </label>
                  <label>
                    報酬
                    <select
                      value={editing.reward}
                      onChange={(e) => {
                        const reward = e.target.value as MissionReward;
                        updateMission(editing.key, {
                          reward,
                          amount: reward === "points" ? Math.max(editing.amount, 10) : 1,
                        });
                      }}
                    >
                      <option value="stamp">スタンプ</option>
                      <option value="points">ポイント</option>
                    </select>
                  </label>
                  <label>
                    {editing.reward === "points" ? "ポイント" : "個数"}
                    <input
                      type="number"
                      min={1}
                      max={9999}
                      value={editing.amount}
                      onChange={(e) =>
                        updateMission(editing.key, {
                          amount: Math.min(9999, Math.max(1, Number(e.target.value) || 1)),
                        })
                      }
                    />
                  </label>
                </div>
                <label>
                  達成条件
                  <input
                    value={editing.condition}
                    maxLength={80}
                    onChange={(e) => updateMission(editing.key, { condition: e.target.value })}
                  />
                </label>
                {editing.kind === "friends" ? (
                  <p style={{ margin: 0, padding: "0.6rem 0.7rem", borderRadius: "0.7rem", background: "#f8fcf9", border: "1px dashed #cfe3d6", fontSize: "0.75rem", color: "#3c4a40", lineHeight: 1.6 }}>
                    参加者は、友だちとふたりで決めた同じ合言葉を、それぞれの画面で入れます。10分以内にふたりが入れると、ふたりとも達成になります。合言葉は参加者が自由に決めるので、ここで設定するものはありません。
                  </p>
                ) : null}
                {editing.kind === "photo" ? (
                  <p style={{ margin: 0, padding: "0.6rem 0.7rem", borderRadius: "0.7rem", background: "#f8fcf9", border: "1px dashed #cfe3d6", fontSize: "0.75rem", color: "#3c4a40", lineHeight: 1.6 }}>
                    参加者が写真を撮って送ると達成になります。届いた写真は、公開後のゲーム管理画面の「届いた写真」で見られます。
                  </p>
                ) : null}
                {editing.kind === "quiz" ? (
                  <MissionQuizFields
                    question={editing.question}
                    choices={editing.choices}
                    correctIndex={editing.correctIndex}
                    onChange={(patch) => updateMission(editing.key, patch)}
                  />
                ) : null}
                {MISSION_PLACE_KINDS.includes(editing.kind) ? (
                  <>
                    <label>
                      場所の名前
                      <input
                        value={editing.place}
                        maxLength={40}
                        placeholder="例：中央広場"
                        onChange={(e) => updateMission(editing.key, { place: e.target.value })}
                      />
                    </label>
                    <ArrivalFields
                      value={editing}
                      itemLabel="ミッション"
                      onChange={(patch) => updateMission(editing.key, patch)}
                    />
                  </>
                ) : null}
                <button type="button" className="org-mission__editor-done" onClick={() => setEditingKey(null)}>
                  編集を閉じる
                </button>
              </div>
            ) : null;

  return (
    <GameCreateShell
      title="ミッション作成"
      subtitle="まちを楽しく巡るミッションゲームを作成して、参加者に特別な体験を届けましょう。"
      steps={STEPS}
      step={step}
      onStep={setStep}
      saving={saving}
      error={error}
      onTry={() => setTesting(true)}
      onDraft={() => void save("draft")}
      onPublish={() => void save("published")}
      preview={
        <GamePhonePreview
          kind="mission"
          typeLabel="ミッション"
          name={name}
          description={description}
          settings={settingsBody}
          look={lookEdit}
          stepView={step === 0 ? "start" : step === STEPS.length - 1 ? "clear" : "play"}
        />
      }
    >
      {step === 0 ? (
          <section className="org-mission__card" aria-labelledby="mission-basic">
            <div className="org-mission__card-title">
              <span>1</span>
              <div>
                <h2 id="mission-basic">基本情報</h2>
                <p>ゲームの基本情報を設定します。</p>
              </div>
            </div>
            <div className="org-mission__grid">
              <label className="org-mission__field org-mission__field--wide">
                <span>
                  ゲーム名 <em>必須</em>
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  required
                />
                <small>{name.length}/50</small>
              </label>
              <label className="org-mission__field">
                <span>対象イベント（任意）</span>
                <select
                  value={eventId}
                  disabled={loadingEvents}
                  onChange={(e) => {
                    setEventId(e.target.value);
                    // イベントの日があれば、開催期間をその日に合わせる（あとで変えられる）。
                    const picked = events.find((event) => event.id === e.target.value);
                    const day = picked?.date?.slice(0, 10);
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
              <fieldset className="org-mission__field">
                <legend>
                  開催期間 <em>必須</em>
                </legend>
                <div className="org-mission__dates">
                  <input
                    type="date"
                    aria-label="開始日"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <span aria-hidden>〜</span>
                  <input
                    type="date"
                    aria-label="終了日"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.45rem" }}>
                  {PERIOD_PRESETS.map((preset) => {
                    const on = startDate && endDate === jstDate(preset.days, startDate);
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setEndDate(jstDate(preset.days, startDate || jstDate()))}
                        style={{
                          minHeight: "2rem",
                          padding: "0 0.75rem",
                          border: `1.5px solid ${on ? "#1f7a4a" : "#dfe7e1"}`,
                          borderRadius: 999,
                          background: on ? "#eef7f1" : "#fff",
                          color: on ? "#1f7a4a" : "#3c4a40",
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate(jstDate());
                      if (endDate && endDate < jstDate()) setEndDate(jstDate(29));
                    }}
                    style={{ minHeight: "2rem", padding: "0 0.75rem", border: 0, background: "none", color: "#1f7a4a", fontSize: "0.75rem", fontWeight: 800, textDecoration: "underline", cursor: "pointer" }}
                  >
                    今日から
                  </button>
                </div>
                <small style={{ color: periodError ? "#c0392b" : undefined }}>
                  {periodError ?? `${periodDays}日間。この期間だけ参加できます。`}
                </small>
              </fieldset>
              <label className="org-mission__field org-mission__field--wide">
                <span>説明文</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={300}
                  rows={3}
                />
                <small>{description.length}/300</small>
              </label>
            </div>
          </section>
      ) : null}
      {step === 1 ? (
          <section className="org-mission__card" aria-labelledby="mission-formats">
            <div className="org-mission__card-title">
              <span>2</span>
              <div>
                <h2 id="mission-formats">ミッション形式</h2>
                <p>このゲームで使うミッションの形式を選びます。押すと ✓ が付きます（いくつでも選べます）。</p>
              </div>
            </div>
            <ul className="org-mission__formats">
              {MISSION_KINDS.map((kind) => {
                const on = formats.includes(kind.id);
                const Icon = KIND_ICONS[kind.id];
                return (
                  <li key={kind.id}>
                    <button
                      type="button"
                      className={cn("org-mission__format", `is-${kind.id}`, on && "is-on")}
                      aria-pressed={on}
                      onClick={() => toggleFormat(kind.id)}
                      // 選んでいないものは薄くして、選んでいるものとの違いを分かりやすく。
                      style={{ position: "relative", opacity: on ? 1 : 0.55, filter: on ? undefined : "saturate(0.4)" }}
                    >
                      <span
                        aria-hidden
                        style={{
                          position: "absolute",
                          top: "0.7rem",
                          right: "0.7rem",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "1.6rem",
                          height: "1.6rem",
                          borderRadius: "50%",
                          border: on ? "0" : "2px solid #b9c4bd",
                          background: on ? "#1f7a4a" : "#fff",
                          color: "#fff",
                          fontSize: "0.9rem",
                          fontWeight: 900,
                        }}
                      >
                        {on ? "✓" : ""}
                      </span>
                      <Icon className="h-5 w-5" aria-hidden />
                      <strong>{kind.label}</strong>
                      <span>{kind.blurb}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
      ) : null}
      {step === 2 ? (
          <section className="org-mission__card" aria-labelledby="mission-list">
            <div className="org-mission__card-head">
              <div className="org-mission__card-title">
                <span>3</span>
                <div>
                  <h2 id="mission-list">ミッション一覧</h2>
                  <p>ミッションを追加して、達成条件や報酬を設定します。</p>
                </div>
              </div>
              <button type="button" className="org-mission__add" onClick={addMission}>
                <Plus className="h-4 w-4" aria-hidden />
                ミッションを追加する
              </button>
            </div>
            {missions.length === 0 ? (
              <p className="org-mission__empty">まだミッションがありません。まちを巡る課題を追加しましょう。</p>
            ) : (
              <>
              <style>{OPEN_CARD_CSS}</style>
              <ol style={{ display: "grid", gap: "0.6rem", margin: "0.8rem 0 0", padding: 0, listStyle: "none" }}>
                {missions.map((mission, index) => {
                  const Icon = KIND_ICONS[mission.kind];
                  const open = editingKey === mission.key;
                  const todo = missionTodo(mission);
                  return (
                    <li
                      key={mission.key}
                      className={open ? "mission-open" : undefined}
                      style={{
                        border: `1.5px solid ${open ? "#9fd3b2" : "#e4ece6"}`,
                        borderRadius: "1rem",
                        background: mission.published ? "#fff" : "#f6f7f6",
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.7rem", padding: open ? "0.6rem 0.85rem" : "0.8rem 0.85rem" }}>
                        <span
                          aria-hidden
                          style={{
                            display: "inline-flex",
                            flex: "none",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "1.8rem",
                            height: "1.8rem",
                            borderRadius: "50%",
                            background: "#e7f4ec",
                            color: "#1f7a4a",
                            fontWeight: 900,
                            fontSize: "0.8rem",
                          }}
                        >
                          {index + 1}
                        </span>
                        <button
                          type="button"
                          aria-expanded={open}
                          onClick={() => setEditingKey(open ? null : mission.key)}
                          style={{ display: "grid", gap: "0.3rem", flex: 1, minWidth: 0, padding: 0, border: 0, background: "none", textAlign: "left", cursor: "pointer" }}
                        >
                          <b style={{ fontSize: "0.95rem", color: mission.published ? "#1a2214" : "#8a968e" }}>
                            {mission.name.trim() || "名前を入れてください"}
                          </b>
                          <span style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", alignItems: "center" }}>
                            <span className={cn("org-mission__kind", `is-${mission.kind}`)}>
                              <Icon className="h-3.5 w-3.5" aria-hidden />
                              {missionKindLabel(mission.kind)}
                            </span>
                            <span style={{ fontSize: "0.72rem", color: "#5d6b62", fontWeight: 700 }}>{missionRewardLabel(mission)}</span>
                            {todo ? (
                              <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#b45309", background: "#fff4dc", borderRadius: 999, padding: "0.1rem 0.5rem" }}>
                                {todo}
                              </span>
                            ) : null}
                            {mission.published ? null : (
                              <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#6a7568", background: "#eceeec", borderRadius: 999, padding: "0.1rem 0.5rem" }}>
                                非公開
                              </span>
                            )}
                          </span>
                          {mission.condition.trim() && !open ? (
                            <small style={{ fontSize: "0.75rem", color: "#6a7568", lineHeight: 1.5 }}>{mission.condition}</small>
                          ) : null}
                        </button>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={mission.published}
                          aria-label={`${mission.name || "ミッション"}を公開`}
                          title={mission.published ? "公開中（押すと非公開）" : "非公開（押すと公開）"}
                          className={cn("org-mission__switch", mission.published && "is-on")}
                          onClick={() => updateMission(mission.key, { published: !mission.published })}
                          style={{ flex: "none" }}
                        >
                          <span />
                        </button>
                      </div>
                      {/* 開いているあいだは操作ボタンを隠して、編集欄をすぐ下に出す（閉じるは編集欄の下・名前を押す）。 */}
                      {open ? null : (
                      <div style={{ display: "flex", gap: "0.25rem", padding: "0 0.85rem 0.6rem 3.35rem", flexWrap: "wrap" }}>
                        {[
                          { label: open ? "閉じる" : "編集", icon: Pencil, onClick: () => setEditingKey(open ? null : mission.key) },
                          { label: "上へ", icon: ChevronUp, onClick: () => moveMission(mission.key, -1), disabled: index === 0 },
                          { label: "下へ", icon: ChevronDown, onClick: () => moveMission(mission.key, 1), disabled: index === missions.length - 1 },
                          { label: "複製", icon: Copy, onClick: () => duplicateMission(mission.key) },
                          { label: "削除", icon: Trash2, onClick: () => removeMission(mission.key) },
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
                      )}
                      {open ? (
                        <div style={{ padding: "0 0.85rem 0.85rem", borderTop: "1px dashed #cfe3d6", paddingTop: "0.7rem" }}>{editorNode}</div>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
              <button type="button" className="org-mission__add" style={{ marginTop: "0.7rem" }} onClick={addMission}>
                <Plus className="h-4 w-4" aria-hidden />
                ミッションを追加する
              </button>
              </>
            )}
          </section>
      ) : null}
      {step === 3 ? (
            <section className="org-mission__card" aria-labelledby="mission-rewards">
              <div className="org-mission__card-title">
                <span>4</span>
                <div>
                  <h2 id="mission-rewards">達成条件・特典</h2>
                  <p>クリア条件と、参加者への特典を設定します。</p>
                </div>
              </div>
              <label className="org-mission__field">
                <span>クリア条件</span>
                <select value={clearCount} onChange={(e) => setClearCount(Number(e.target.value))}>
                  {Array.from({ length: clearOptions }, (_, index) => index + 1).map((count) => (
                    <option key={count} value={count}>
                      {count}つ以上達成でクリア
                    </option>
                  ))}
                </select>
              </label>
              <p className="org-mission__label">達成特典</p>
              <ul className="org-mission__rewards">
                {REWARD_OPTIONS.map((option) => {
                  const on = option.id === "coupon" ? couponOn : option.id === "points" ? pointsOn : stampOn;
                  const toggle =
                    option.id === "coupon"
                      ? () => setCouponOn((value) => !value)
                      : option.id === "points"
                        ? () => setPointsOn((value) => !value)
                        : () => setStampOn((value) => !value);
                  const Icon = option.id === "stamp" ? Stamp : option.id === "points" ? Trophy : Gift;
                  return (
                    <li key={option.id}>
                      <button
                        type="button"
                        className={cn("org-mission__reward", on && "is-on", option.id === "coupon" && on && "is-coupon")}
                        aria-pressed={on}
                        onClick={toggle}
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                        <span>
                          <strong>{option.label}</strong>
                          <em>{option.blurb}</em>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <label className="org-mission__field">
                <span>景品引換場所</span>
                <input
                  value={prizePlace}
                  maxLength={40}
                  onChange={(e) => setPrizePlace(e.target.value)}
                  placeholder="中央観光案内所"
                />
              </label>
            </section>
      ) : null}
      {step === 4 ? (
            <section className="org-mission__card" aria-labelledby="mission-publish">
              <div className="org-mission__card-title">
                <span>5</span>
                <div>
                  <h2 id="mission-publish">公開設定</h2>
                  <p>参加の範囲や表示内容を選びます。</p>
                </div>
              </div>
              <ul className="org-mission__publish">
                {/* 参加パスとゲームのつなぎこみは、ゲームを作り終えてから入れる。それまでは押せない「準備中」にしておく。 */}
                <li style={{ opacity: 0.6 }}>
                  <div>
                    <strong>
                      参加パス購入者のみ参加可能
                      <em style={{ marginLeft: "0.4rem", padding: "0.05rem 0.45rem", borderRadius: 999, background: "#eceeec", color: "#6a7568", fontSize: "0.66rem", fontStyle: "normal" }}>
                        準備中
                      </em>
                    </strong>
                    <span>いまは誰でも参加できます。参加パスとのつなぎこみは、このあと追加します。</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={false}
                    aria-label="参加パス購入者のみ参加可能（準備中）"
                    className="org-mission__switch"
                    disabled
                    style={{ cursor: "not-allowed" }}
                  >
                    <span />
                  </button>
                </li>
                <li>
                  <div>
                    <strong>ランキングを表示</strong>
                    <span>クリアした人に順位を見せます（達成数が多い順、同じ数なら早くクリアした人が上）</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={rankingOn}
                    aria-label="ランキングを表示"
                    className={cn("org-mission__switch", rankingOn && "is-on")}
                    onClick={() => setRankingOn((value) => !value)}
                  >
                    <span />
                  </button>
                </li>
                <li>
                  <div>
                    <strong>ヒントを表示</strong>
                    <span>達成の手がかりを参加画面に出します</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={hintsOn}
                    aria-label="ヒントを表示"
                    className={cn("org-mission__switch", hintsOn && "is-on")}
                    onClick={() => setHintsOn((value) => !value)}
                  >
                    <span />
                  </button>
                </li>
              </ul>
            </section>
      ) : null}
      {testing ? (
        <MissionTestPlay
          name={name}
          description={description}
          missions={missions}
          clearCount={clearCount}
          hintsOn={hintsOn}
          rewards={{ coupon: couponOn, points: pointsOn, stamp: stampOn }}
          prizePlace={prizePlace}
          onClose={() => setTesting(false)}
        />
      ) : null}
    </GameCreateShell>
  );
}

/** 「クイズに答える」の問題文・選択肢・正解。正解した人だけ達成になる。 */
function MissionQuizFields({
  question,
  choices,
  correctIndex,
  onChange,
}: {
  question: string;
  choices: string[];
  correctIndex: number;
  onChange: (patch: { question?: string; choices?: string[]; correctIndex?: number }) => void;
}) {
  const list = choices.length >= 2 ? choices : [...choices, "", ""].slice(0, 2);
  const filled = list.filter((choice) => choice.trim()).length;
  return (
    <div style={{ display: "grid", gap: "0.5rem", padding: "0.7rem", border: "1px dashed #cfe3d6", borderRadius: "0.8rem", background: "#f8fcf9" }}>
      <label style={{ display: "grid", gap: "0.25rem" }}>
        問題文
        <textarea
          value={question}
          maxLength={120}
          rows={2}
          placeholder="例：中央広場の時計台は、何年にできた？"
          onChange={(event) => onChange({ question: event.target.value })}
        />
      </label>
      <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#3c4a40" }}>選択肢（正解の ● を押す）</span>
      {list.map((choice, index) => (
        <div key={index} style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
          <input
            type="radio"
            name="mission-quiz-correct"
            checked={correctIndex === index}
            aria-label={`選択肢${index + 1}を正解にする`}
            onChange={() => onChange({ correctIndex: index })}
          />
          <input
            value={choice}
            maxLength={40}
            placeholder={`選択肢 ${index + 1}`}
            style={{ flex: 1 }}
            onChange={(event) => onChange({ choices: list.map((item, i) => (i === index ? event.target.value : item)) })}
          />
          {list.length > 2 ? (
            <button
              type="button"
              aria-label={`選択肢${index + 1}を消す`}
              onClick={() =>
                onChange({
                  choices: list.filter((_, i) => i !== index),
                  correctIndex: correctIndex === index ? 0 : correctIndex > index ? correctIndex - 1 : correctIndex,
                })
              }
              style={{ border: 0, background: "none", color: "#8a968e", fontSize: "1rem", cursor: "pointer" }}
            >
              ×
            </button>
          ) : null}
        </div>
      ))}
      {list.length < 4 ? (
        <button
          type="button"
          onClick={() => onChange({ choices: [...list, ""] })}
          style={{ justifySelf: "start", border: 0, background: "none", color: "#1f7a4a", fontSize: "0.78rem", fontWeight: 800, cursor: "pointer" }}
        >
          ＋ 選択肢を足す
        </button>
      ) : null}
      <small style={{ color: !question.trim() || filled < 2 || !list[correctIndex]?.trim() ? "#c0392b" : "#6a7568" }}>
        {!question.trim() || filled < 2 || !list[correctIndex]?.trim()
          ? "問題文・2つ以上の選択肢・正解を入れると、正解した人だけ達成になります（それまでは押すだけで達成）。"
          : "正解した人だけ達成になります。まちがえたら、もう一度答えられます。"}
      </small>
    </div>
  );
}
