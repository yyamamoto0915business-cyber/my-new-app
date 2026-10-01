"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  CircleHelp,
  Copy,
  Flag,
  Footprints,
  Gift,
  KeyRound,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Send,
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
  missionKindLabel,
  missionRewardLabel,
  sampleMissions,
  type MissionItem,
  type MissionKindId,
  type MissionReward,
} from "@/lib/organizer/mission";
import { OrganizerMissionPreview } from "@/components/organizer/games/OrganizerMissionPreview";
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

function toIsoFromDate(date: string): string | null {
  if (!date) return null;
  const value = new Date(`${date}T00:00:00+09:00`);
  if (Number.isNaN(value.getTime())) return null;
  return value.toISOString();
}

function formatPeriod(startDate: string, endDate: string): string | null {
  const fmt = (date: string) => {
    const value = new Date(`${date}T00:00:00+09:00`);
    if (Number.isNaN(value.getTime())) return date;
    const weekday = new Intl.DateTimeFormat("ja-JP", { weekday: "short" }).format(value);
    return `${date.replaceAll("-", "/")}（${weekday}）`;
  };
  if (startDate && endDate) return `${fmt(startDate)} 〜 ${fmt(endDate)}`;
  if (startDate) return `${fmt(startDate)} から`;
  if (endDate) return `${fmt(endDate)} まで`;
  return null;
}

export function OrganizerMissionCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("まち巡り発見ミッション ～春のまちなかさんぽ～");
  const [eventId, setEventId] = useState("");
  const [description, setDescription] = useState(
    "まちなかを巡って、スポットを発見したり、写真を撮ったり、クイズに挑戦しながら、このまちの魅力を再発見できるミッションゲームです。"
  );
  const [startDate, setStartDate] = useState("2025-04-01");
  const [endDate, setEndDate] = useState("2025-04-30");
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
  const [passOnly, setPassOnly] = useState(true);
  const [rankingOn, setRankingOn] = useState(true);
  const [hintsOn, setHintsOn] = useState(true);
  const [device, setDevice] = useState<"phone" | "tablet">("phone");
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

  const eventHint = useMemo(() => {
    if (loadingEvents) return "イベントを読み込み中です";
    if (events.length === 0) return "先にイベントを掲載すると、対象を選べます";
    return null;
  }, [loadingEvents, events.length]);

  const editing = missions.find((mission) => mission.key === editingKey) ?? null;
  const periodLabel = formatPeriod(startDate, endDate);
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

  function removeMission(key: string) {
    setMissions((current) => current.filter((mission) => mission.key !== key));
    if (editingKey === key) setEditingKey(null);
  }

  function updateMission(key: string, patch: Partial<MissionItem>) {
    setMissions((current) =>
      current.map((mission) => (mission.key === key ? { ...mission, ...patch } : mission))
    );
  }

  async function save(status: "draft" | "published") {
    if (!name.trim()) {
      setError("ゲーム名を入力してください");
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
          mission: {
            formats,
            missions: missions.map(({ kind, name: missionName, condition, reward, amount, published }) => ({
              kind,
              name: missionName,
              condition,
              reward,
              amount,
              published,
            })),
            clearCount,
            rewards: { coupon: couponOn, points: pointsOn, stamp: stampOn },
            prizePlace,
            publish: { passOnly, ranking: rankingOn, hints: hintsOn },
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
      <div className="org-mission">
        <GamePublishSuccess typeLabel="ミッション" />
      </div>
    );
  }

  return (
    <div className="org-mission">
      <Link href="/organizer/games" className="org-mission__back">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        ゲーム機能に戻る
      </Link>

      <header className="org-mission__page">
        <h1>ミッション作成</h1>
        <p>まちを楽しく巡るミッションゲームを作成して、参加者に特別な体験を届けましょう。</p>
      </header>

      <section className="org-mission__hero" aria-label="ミッションの案内">
        <Image
          src="/organizer/games/games-hero.png"
          alt=""
          fill
          priority
          unoptimized
          className="org-mission__hero-img"
          sizes="(min-width: 1080px) 70vw, 100vw"
        />
        <div className="org-mission__hero-copy">
          <h2>ミッションで、まちの魅力をもっと届けよう！</h2>
          <p>参加者が楽しみながらまちを巡り、発見し、思い出をつくる体験をかんたんに作成できます。</p>
          <ul>
            <li>
              <Footprints className="h-3.5 w-3.5" aria-hidden />
              回遊を促進
            </li>
            <li>
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              行動を引き出す
            </li>
            <li>
              <Trophy className="h-3.5 w-3.5" aria-hidden />
              達成感がある
            </li>
          </ul>
        </div>
      </section>

      <div className="org-mission__layout">
        <div className="org-mission__main">
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
                <span>
                  対象イベント <em>必須</em>
                </span>
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
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
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

          <section className="org-mission__card" aria-labelledby="mission-formats">
            <div className="org-mission__card-title">
              <span>2</span>
              <div>
                <h2 id="mission-formats">ミッション形式</h2>
                <p>このゲームで使うミッションの形式を選択します。（複数選択可）</p>
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
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                      <strong>{kind.label}</strong>
                      <span>{kind.blurb}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

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
              <div className="org-mission__table-wrap">
                <table className="org-mission__table">
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">ミッション名</th>
                      <th scope="col">種類</th>
                      <th scope="col">達成条件</th>
                      <th scope="col">報酬</th>
                      <th scope="col">公開</th>
                      <th scope="col">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {missions.map((mission, index) => {
                      const Icon = KIND_ICONS[mission.kind];
                      return (
                        <tr key={mission.key}>
                          <td>{index + 1}</td>
                          <td>{mission.name.trim() || "名称未設定"}</td>
                          <td>
                            <span className={cn("org-mission__kind", `is-${mission.kind}`)}>
                              <Icon className="h-3.5 w-3.5" aria-hidden />
                              {missionKindLabel(mission.kind)}
                            </span>
                          </td>
                          <td>{mission.condition.trim() || "未設定"}</td>
                          <td>{missionRewardLabel(mission)}</td>
                          <td>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={mission.published}
                              aria-label={`${mission.name || "ミッション"}を公開`}
                              className={cn("org-mission__switch", mission.published && "is-on")}
                              onClick={() => updateMission(mission.key, { published: !mission.published })}
                            >
                              <span />
                            </button>
                          </td>
                          <td>
                            <div className="org-mission__tools">
                              <button type="button" onClick={() => setEditingKey(mission.key)}>
                                <Pencil className="h-3.5 w-3.5" aria-hidden />
                                編集
                              </button>
                              <button type="button" onClick={() => duplicateMission(mission.key)}>
                                <Copy className="h-3.5 w-3.5" aria-hidden />
                                複製
                              </button>
                              <button type="button" onClick={() => removeMission(mission.key)}>
                                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                削除
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {editing ? (
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
                <button type="button" className="org-mission__editor-done" onClick={() => setEditingKey(null)}>
                  編集を閉じる
                </button>
              </div>
            ) : null}
          </section>

          <div className="org-mission__split">
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

            <section className="org-mission__card" aria-labelledby="mission-publish">
              <div className="org-mission__card-title">
                <span>5</span>
                <div>
                  <h2 id="mission-publish">公開設定</h2>
                  <p>参加の範囲や表示内容を選びます。</p>
                </div>
              </div>
              <ul className="org-mission__publish">
                <li>
                  <div>
                    <strong>参加パス購入者のみ参加可能</strong>
                    <span>パスを持っている人だけが参加できます</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={passOnly}
                    aria-label="参加パス購入者のみ参加可能"
                    className={cn("org-mission__switch", passOnly && "is-on")}
                    onClick={() => setPassOnly((value) => !value)}
                  >
                    <span />
                  </button>
                </li>
                <li>
                  <div>
                    <strong>ランキングを表示</strong>
                    <span>達成数の順位を参加者に見せます</span>
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
          </div>
        </div>

        <OrganizerMissionPreview
          name={name}
          periodLabel={periodLabel}
          missions={missions}
          device={device}
          onDevice={setDevice}
        />
      </div>

      {error ? <p className="org-mission__error">{error}</p> : null}
      <div className="org-mission__actions">
        <button type="button" className="org-mission__draft" disabled={saving} onClick={() => void save("draft")}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          下書き保存
        </button>
        <button type="button" className="org-mission__publish-btn" disabled={saving} onClick={() => void save("published")}>
          <Send className="h-4 w-4" aria-hidden />
          公開する
        </button>
      </div>
    </div>
  );
}
