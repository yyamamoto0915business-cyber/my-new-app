"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUp, Check, GripVertical, Loader2, Plus, Trash2 } from "lucide-react";
import { OrganizerWorkspacePageHeader } from "@/components/organizer/OrganizerWorkspacePageHeader";
import { GameAudioField } from "@/components/organizer/games/GameAudioField";
import { GameImageField } from "@/components/organizer/games/GameImageField";
import { GameVideoField } from "@/components/organizer/games/GameVideoField";
import { StampRallyTestPlay } from "@/components/organizer/games/StampRallyTestPlay";
import { SpotPinField } from "@/components/organizer/games/SpotPinField";
import { StampRallyPreview } from "@/components/organizer/games/StampRallyPreview";
import styles from "@/components/organizer/games/StampRallyWizard.module.css";
import {
  DEFAULT_ORGANIZER_GAME_TYPE_ID,
  ORGANIZER_GAME_TYPES,
  getOrganizerGameType,
  isOrganizerGameTypeId,
} from "@/lib/organizer/game-types";
import {
  GAME_AUDIENCE_LABEL,
  GAME_AUDIENCES,
  GAME_CHECKIN_LABEL,
  GAME_CHECKIN_METHODS,
  GAME_CHECKIN_RADIUS_PRESETS,
  GAME_EXPERIENCE_CATEGORIES,
  GAME_HOWTO_ICON_LABEL,
  GAME_HOWTO_ICONS,
  GAME_PLAY_LIMIT_LABEL,
  GAME_PLAY_LIMITS,
  GAME_REWARD_KIND_LABEL,
  GAME_REWARD_KINDS,
  GAME_ROUTE_LABEL,
  GAME_ROUTES,
  GAME_SCREEN_IDS,
  GAME_SCREEN_LABEL,
  GAME_STAMP_ANIMATION_LABEL,
  GAME_STAMP_ANIMATIONS,
  GAME_STAMP_SOUND_LABEL,
  GAME_STAMP_SOUNDS,
  createDefaultExperience,
  createExperienceSpot,
  experienceChecklist,
  sanitizeGameExperience,
  type GameExperience,
  type GameExperienceSpot,
  type GameHowtoIcon,
  type GameScreenId,
} from "@/lib/organizer/game-experience";
import {
  MAX_ORGANIZER_GAME_SPOTS,
  ORGANIZER_GAME_SPOT_KIND_LABEL,
  type OrganizerGameSpotKind,
} from "@/lib/organizer/game-tokens";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { OrganizerGameEventOption } from "@/lib/organizer/games";
import { STAMP_RALLY_TEMPLATES } from "@/lib/organizer/stamp-rally-templates";
import { cn } from "@/lib/utils";

const DRAFT_KEY = "mg-stamp-rally-draft-v1";
const STEPS = ["基本設定", "スポット設定", "画面・演出設定", "達成条件・特典", "確認・公開"] as const;
type Step = 1 | 2 | 3 | 4 | 5;

type DraftSpot = GameExperienceSpot & {
  key: string;
  id?: string;
  name: string;
  kind: OrganizerGameSpotKind;
};

function createDraftSpot(index: number): DraftSpot {
  return {
    key: crypto.randomUUID(),
    name: `スポット ${index + 1}`,
    kind: "stamp",
    ...createExperienceSpot(),
  };
}

function splitTokyo(iso: string | null, fallbackTime: string): { date: string; time: string } {
  if (!iso) return { date: "", time: fallbackTime };
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { date: "", time: fallbackTime };
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

function toIso(date: string, time: string): string | null {
  if (!date) return null;
  const value = new Date(`${date}T${time.trim() || "00:00"}:00+09:00`);
  if (Number.isNaN(value.getTime())) return null;
  return value.toISOString();
}

function formatPeriod(startDate: string, startTime: string, endDate: string, endTime: string): string | null {
  if (!startDate && !endDate) return null;
  const fmt = (date: string, time: string) => {
    if (!date) return "";
    const d = new Date(`${date}T${(time || "00:00")}:00+09:00`);
    if (Number.isNaN(d.getTime())) return date;
    return new Intl.DateTimeFormat("ja-JP", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };
  const start = fmt(startDate, startTime);
  const end = fmt(endDate, endTime);
  if (start && end) return `${start} 〜 ${end}`;
  if (start) return `${start} から`;
  return `${end} まで`;
}

function isStep(value: number): value is Step {
  return value >= 1 && value <= 5;
}

export function StampRallyWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedType = searchParams.get("type") ?? "";
  const editId = searchParams.get("edit") ?? "";
  const selectedType = isOrganizerGameTypeId(requestedType) ? requestedType : DEFAULT_ORGANIZER_GAME_TYPE_ID;
  const selectedMeta = getOrganizerGameType(selectedType);
  const typeId = selectedMeta.available ? selectedType : DEFAULT_ORGANIZER_GAME_TYPE_ID;

  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [screen, setScreen] = useState<GameScreenId>("start");
  const [savedGameId, setSavedGameId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [eventId, setEventId] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("16:00");
  const [experience, setExperience] = useState<GameExperience>(() => createDefaultExperience());
  const [spots, setSpots] = useState<DraftSpot[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [events, setEvents] = useState<OrganizerGameEventOption[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [published, setPublished] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [help, setHelp] = useState<string | null>(null);
  const leavingRef = useRef(false);

  useEffect(() => {
    if (editId) return;
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const stored = JSON.parse(raw) as Record<string, unknown>;
      if (stored.v !== 1) return;
      if (typeof stored.name === "string") setName(stored.name.slice(0, 80));
      if (typeof stored.eventId === "string") setEventId(stored.eventId);
      if (typeof stored.description === "string") setDescription(stored.description.slice(0, 300));
      if (typeof stored.startDate === "string") setStartDate(stored.startDate);
      if (stored.startDate || stored.endDate) setPeriodOpen(true);
      if (typeof stored.startTime === "string") setStartTime(stored.startTime);
      if (typeof stored.endDate === "string") setEndDate(stored.endDate);
      if (typeof stored.endTime === "string") setEndTime(stored.endTime);
      if (typeof stored.savedGameId === "string") setSavedGameId(stored.savedGameId);
      if (typeof stored.step === "number" && isStep(stored.step)) setStep(stored.step);
      if (typeof stored.screen === "string" && GAME_SCREEN_IDS.includes(stored.screen as GameScreenId)) {
        setScreen(stored.screen as GameScreenId);
      }
      const nextExperience = sanitizeGameExperience(stored.experience);
      if (nextExperience) setExperience(nextExperience);
      if (Array.isArray(stored.spots)) {
        const nextSpots = stored.spots.slice(0, MAX_ORGANIZER_GAME_SPOTS).flatMap((item, index) => {
          if (!item || typeof item !== "object") return [];
          const row = item as Record<string, unknown>;
          const meta = sanitizeGameExperience({ spots: [row] })?.spots[0] ?? createExperienceSpot();
          const id =
            typeof row.id === "string" &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(row.id)
              ? row.id
              : undefined;
          return [
            {
              ...meta,
              key: typeof row.key === "string" && row.key ? row.key : crypto.randomUUID(),
              id,
              name: typeof row.name === "string" ? row.name.slice(0, 40) : `スポット ${index + 1}`,
              kind: row.kind === "goal" ? "goal" : "stamp",
            } satisfies DraftSpot,
          ];
        });
        setSpots(nextSpots);
      }
      if (typeof stored.selectedIndex === "number") setSelectedIndex(stored.selectedIndex);
    } catch {
      /* 下書きの復元に失敗しても、空の作成から始められる */
    } finally {
      setReady(true);
    }
  }, [editId]);

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchWithTimeout(`/api/organizer/games/${editId}`, { cache: "no-store" }, 8000);
        const json = (await res.json()) as {
          error?: string;
          game?: {
            name?: string;
            eventId?: string | null;
            description?: string;
            startsAt?: string | null;
            endsAt?: string | null;
            status?: string;
            type?: string;
          };
          spots?: { id: string; name: string; kind: string }[];
          experience?: GameExperience | null;
        };
        if (!res.ok || !json.game) throw new Error(json.error || "ゲームを読み込めませんでした");
        if (cancelled) return;
        const game = json.game;
        const nextExperience = json.experience ?? createDefaultExperience();
        const start = splitTokyo(game.startsAt ?? null, "09:00");
        const end = splitTokyo(game.endsAt ?? null, "16:00");
        setSavedGameId(editId);
        setName(game.name ?? "");
        setEventId(game.eventId ?? "");
        setDescription(game.description ?? "");
        setStartDate(start.date);
        if (start.date || end.date) setPeriodOpen(true);
        setMoreOpen(true);
        setStartTime(start.time);
        setEndDate(end.date);
        setEndTime(end.time);
        setPublished(game.status === "published");
        setExperience(nextExperience);
        setSpots(
          (json.spots ?? []).map((spot, index) => ({
            ...createExperienceSpot(),
            ...(nextExperience.spots[index] ?? {}),
            key: spot.id,
            id: spot.id,
            name: spot.name,
            kind: spot.kind === "goal" ? "goal" : "stamp",
          })),
        );
        setSelectedIndex(0);
        setStep(1);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "ゲームを読み込めませんでした");
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId]);

  useEffect(() => {
    if (!ready || leavingRef.current || editId) return;
    const payload = {
      v: 1,
      step,
      screen,
      savedGameId,
      name,
      eventId,
      description,
      startDate,
      startTime,
      endDate,
      endTime,
      selectedIndex,
      experience,
      spots,
    };
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  }, [
    ready,
    step,
    screen,
    savedGameId,
    name,
    eventId,
    description,
    startDate,
    startTime,
    endDate,
    endTime,
    selectedIndex,
    experience,
    spots,
    editId,
  ]);

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

  const periodLabel = formatPeriod(startDate, startTime, endDate, endTime);
  const selectedSpot = spots[selectedIndex] ?? null;
  const checks = useMemo(
    () => experienceChecklist({ name, spots, experience }),
    [name, spots, experience]
  );
  const previewScreen: GameScreenId = step === 3 ? screen : step === 5 ? "clear" : "start";

  function patchExperience(patch: (current: GameExperience) => GameExperience) {
    setNotice(null);
    setExperience(patch);
  }

  function updateSpot(key: string, patch: Partial<DraftSpot>) {
    setNotice(null);
    setSpots((current) => current.map((spot) => (spot.key === key ? { ...spot, ...patch } : spot)));
  }

  function addSpot() {
    if (spots.length >= MAX_ORGANIZER_GAME_SPOTS) return;
    const next = createDraftSpot(spots.length);
    setSpots((current) => [...current, next]);
    setSelectedIndex(spots.length);
    setNotice(null);
  }

  function moveSpot(index: number, direction: -1 | 1) {
    reorderSpot(index, index + direction);
  }

  function reorderSpot(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= spots.length || to >= spots.length) return;
    setSpots((current) => {
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setSelectedIndex(to);
    setNotice(null);
  }

  function applyTemplate(id: string) {
    const template = STAMP_RALLY_TEMPLATES.find((item) => item.id === id);
    if (!template) return;
    if (
      spots.length > 0 &&
      !window.confirm("テンプレートの内容に差し替えます。いまのスポットも入れ替わります。よろしいですか？")
    ) {
      return;
    }
    setName(template.gameName);
    setDescription(template.description);
    setExperience(template.experience);
    setSpots(
      template.spots.map((spot, index) => ({
        ...createDraftSpot(index),
        name: spot.name,
        kind: spot.kind,
        description: spot.description,
        hint: spot.hint,
      })),
    );
    setSelectedIndex(0);
    setNotice(`${template.name}を入れました。文章はあとから変えられます。`);
  }

  function removeSpot(index: number) {
    setSpots((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setSelectedIndex((current) => Math.max(0, Math.min(current, spots.length - 2)));
  }

  async function saveDraft(mode: "stay" | "next" | "publish") {
    if (!name.trim()) {
      setError("ゲーム名を入力してください");
      setStep(1);
      return;
    }
    const startsAt = toIso(startDate, startTime);
    const endsAt = toIso(endDate, endTime);
    if (startsAt && endsAt && new Date(endsAt) < new Date(startsAt)) {
      setError("終了日時は開始日時より後にしてください");
      setStep(1);
      return;
    }
    setSaving(true);
    setError(null);
    const savedExperience = sanitizeGameExperience({
      ...experience,
      spots: spots.map((spot) => ({
        description: spot.description,
        hint: spot.hint,
        imageUrl: spot.imageUrl,
        videoUrl: spot.videoUrl,
        required: spot.required,
        published: spot.published,
        checkin: spot.checkin,
        radiusM: spot.radiusM,
        keyword: spot.keyword,
        lat: spot.lat,
        lng: spot.lng,
      })),
    });
    try {
      const res = await fetch(savedGameId ? `/api/organizer/games/${savedGameId}` : "/api/organizer/games", {
        method: savedGameId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type: typeId,
          eventId: eventId || null,
          description: description.trim(),
          startsAt,
          endsAt,
          status: mode === "publish" ? "published" : undefined,
          experience: savedExperience,
          spots: spots.map((spot) => ({
            id: spot.id,
            name: spot.name.trim() || "スポット",
            kind: spot.kind,
          })),
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        game?: { id?: string };
        spots?: { id?: string }[];
      };
      if (!res.ok || !json.game?.id) {
        setError(json.error ?? "保存に失敗しました");
        return;
      }
      const gameId = json.game.id;
      setSavedGameId(gameId);
      const serverSpots = json.spots ?? [];
      if (serverSpots.length > 0) {
        setSpots((current) =>
          current.map((spot, index) => ({ ...spot, id: serverSpots[index]?.id ?? spot.id }))
        );
      }
      if (mode === "publish") {
        leavingRef.current = true;
        if (!editId) sessionStorage.removeItem(DRAFT_KEY);
        setPublished(true);
        router.push(`/organizer/games/${gameId}`);
        return;
      }
      if (mode === "next") setStep((current) => (current < 5 ? ((current + 1) as Step) : current));
      setNotice("下書きを保存しました");
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  const otherTypes = ORGANIZER_GAME_TYPES.filter((type) => type.available && type.id !== "stamp");

  return (
    <div className={cn("org-game-create", styles.wizard)}>
      <Link
        href="/organizer/games"
        className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#2D7A4F] hover:underline"
      >
        <ArrowLeft className="size-3.5" strokeWidth={2.4} aria-hidden />
        ゲーム機能に戻る
      </Link>

      <OrganizerWorkspacePageHeader
        title={editId ? "スタンプラリーを直す" : "スタンプラリー作成"}
        subtitle={
          published
            ? "公開中です。画面や特典を直して、変更を保存できます。"
            : "名前を入れると、下書きまで進めます。"
        }
      />

      {!selectedMeta.available ? (
        <p className={styles.note}>{selectedMeta.label}は準備中です。いまはスタンプラリーとして作成します。</p>
      ) : null}

      <ol className={styles.steps} aria-label="作成ステップ">
        {STEPS.map((label, index) => {
          const number = (index + 1) as Step;
          const current = step === number;
          const done = step > number;
          return (
            <li key={label}>
              <button
                type="button"
                className={cn(current && styles["is-current"], done && styles["is-done"])}
                aria-current={current ? "step" : undefined}
                onClick={() => {
                  setStep(number);
                  setNotice(null);
                }}
              >
                <span className={styles.mark}>{done ? <Check className="h-3 w-3" aria-hidden /> : number}</span>
                {label}
              </button>
            </li>
          );
        })}
      </ol>

      <div className={styles.layout}>
        <div className={styles.main}>
          {step === 1 ? (
            <section className={styles.card}>
              <h2>基本設定</h2>
              <p className={cn(styles.lead, styles.leadAside)}>テンプレートを選ぶと、名前とスポットの下書きが入ります。</p>
              <div className={styles.templates} role="group" aria-label="テンプレート">
                {STAMP_RALLY_TEMPLATES.map((template) => (
                  <button key={template.id} type="button" className={styles.template} onClick={() => applyTemplate(template.id)}>
                    <b>{template.name}</b>
                    <small>{template.blurb}</small>
                  </button>
                ))}
              </div>
              <div className="org-store-intro__grid">
                <label className="org-store-intro__field org-store-intro__field--full">
                  <span>
                    ゲーム名 <em>*</em>
                  </span>
                  <input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setNotice(null);
                    }}
                    maxLength={80}
                    placeholder="例: 春のまち歩きスタンプラリー"
                  />
                </label>
              </div>

              <details className={styles.fold} open={periodOpen} onToggle={(e) => setPeriodOpen(e.currentTarget.open)}>
                <summary>
                  <span>期間</span>
                  <small>{periodLabel ?? "あとで決める"}</small>
                </summary>
                <div className="org-store-intro__grid">
                <label className="org-store-intro__field">
                  <span>開始日</span>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </label>
                <label className="org-store-intro__field">
                  <span>開始時刻</span>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </label>
                <label className="org-store-intro__field">
                  <span>終了日</span>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </label>
                <label className="org-store-intro__field">
                  <span>終了時刻</span>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </label>
                </div>
              </details>

              <details className={styles.fold} open={moreOpen} onToggle={(e) => setMoreOpen(e.currentTarget.open)}>
                <summary>
                  <span>くわしい設定</span>
                  <small>対象・回数・画像など(あとから変えられます)</small>
                </summary>
                <div className="org-store-intro__grid">
                <label className="org-store-intro__field org-store-intro__field--full">
                  <span>対象イベント</span>
                  <select
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                    disabled={loadingEvents || events.length === 0}
                  >
                    <option value="">あとで選ぶ</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title}
                      </option>
                    ))}
                  </select>
                  {loadingEvents ? <small>イベントを読み込み中です</small> : null}
                  {!loadingEvents && events.length === 0 ? <small>先にイベントを掲載すると、対象を選べます</small> : null}
                </label>
                <label className="org-store-intro__field org-store-intro__field--full">
                  <span>説明</span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 300))}
                    maxLength={300}
                    rows={4}
                    placeholder="会場周辺のスポットを巡ってスタンプを集めよう"
                  />
                  <small>{description.length}/300</small>
                </label>
                <label className="org-store-intro__field">
                  <span>カテゴリ</span>
                  <select
                    value={experience.basics.category}
                    onChange={(e) =>
                      patchExperience((current) => ({
                        ...current,
                        basics: { ...current.basics, category: e.target.value },
                      }))
                    }
                  >
                    <option value="">未選択</option>
                    {GAME_EXPERIENCE_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="org-store-intro__field">
                  <span>タグ</span>
                  <input
                    value={experience.basics.tags}
                    maxLength={80}
                    placeholder="桜, 商店街"
                    onChange={(e) =>
                      patchExperience((current) => ({
                        ...current,
                        basics: { ...current.basics, tags: e.target.value },
                      }))
                    }
                  />
                </label>
                </div>

              <div className={styles.group} role="radiogroup" aria-label="参加対象">
                <p className={styles.groupTitle}>
                  {"参加対象"}
                  <button type="button" className={styles.help} aria-expanded={help === "audience"} onClick={() => setHelp(help === "audience" ? null : "audience")}>
                    ?
                  </button>
                </p>
                <div className={styles.choices}>
                  {GAME_AUDIENCES.map((audience) => (
                    <button
                      key={audience}
                      type="button"
                      className={cn(styles.choice, experience.basics.audience === audience && styles["is-on"])}
                      aria-pressed={experience.basics.audience === audience}
                      onClick={() =>
                        patchExperience((current) => ({
                          ...current,
                          basics: { ...current.basics, audience },
                        }))
                      }
                    >
                      {GAME_AUDIENCE_LABEL[audience]}
                    </button>
                  ))}
                </div>
                {help === "audience" ? (
                  <p className={styles.note}>
                  誰でもは、ニックネームだけで入れます。イベント参加者と参加パスは、ログインしたアカウントで確認します。対象イベントが必要です。
                  </p>
                ) : null}
              </div>

              <div className={styles.group} role="radiogroup" aria-label="参加回数">
                <p className={styles.groupTitle}>
                  {"参加回数"}
                  <button type="button" className={styles.help} aria-expanded={help === "limit"} onClick={() => setHelp(help === "limit" ? null : "limit")}>
                    ?
                  </button>
                </p>
                <div className={styles.choices}>
                  {GAME_PLAY_LIMITS.map((limit) => (
                    <button
                      key={limit}
                      type="button"
                      className={cn(styles.choice, experience.basics.playLimit === limit && styles["is-on"])}
                      aria-pressed={experience.basics.playLimit === limit}
                      onClick={() =>
                        patchExperience((current) => ({
                          ...current,
                          basics: { ...current.basics, playLimit: limit },
                        }))
                      }
                    >
                      {GAME_PLAY_LIMIT_LABEL[limit]}
                    </button>
                  ))}
                </div>
                {help === "limit" ? (
                  <p className={styles.note}>
                  1人1回は、ログインしたアカウントで1回です。ニックネームを変えても、もう一度は参加できません。何度でもは、クリア後にもう一周できます。
                  </p>
                ) : null}
              </div>

              <div className={styles.group} role="radiogroup" aria-label="ラリー形式">
                <p className={styles.groupTitle}>
                  {"ラリー形式"}
                  <button type="button" className={styles.help} aria-expanded={help === "route"} onClick={() => setHelp(help === "route" ? null : "route")}>
                    ?
                  </button>
                </p>
                <div className={cn(styles.choices, styles.choicesWide)}>
                  {GAME_ROUTES.map((route) => (
                    <button
                      key={route}
                      type="button"
                      className={cn(styles.choice, experience.basics.route === route && styles["is-on"])}
                      aria-pressed={experience.basics.route === route}
                      onClick={() =>
                        patchExperience((current) => ({
                          ...current,
                          basics: { ...current.basics, route },
                        }))
                      }
                    >
                      {GAME_ROUTE_LABEL[route]}
                    </button>
                  ))}
                </div>
                {help === "route" ? (
                  <p className={styles.note}>
                  どこからでもは、最初の1か所を自由に選び、その次から順番に巡ります。指定された順番は、上から順です。好きな順番は、いつでも好きなスポットを押せます。非公開のスポットは参加画面に出ません。
                  </p>
                ) : null}
              </div>

              <GameImageField
                label="メイン画像"
                url={experience.screens.start.imageUrl}
                gameId={savedGameId}
                onChange={(imageUrl) =>
                  patchExperience((current) => ({
                    ...current,
                    screens: { ...current.screens, start: { ...current.screens.start, imageUrl } },
                  }))
                }
              />
              <GameVideoField
                label="スタートの動画"
                url={experience.screens.start.videoUrl}
                gameId={savedGameId}
                onChange={(videoUrl) =>
                  patchExperience((current) => ({
                    ...current,
                    screens: { ...current.screens, start: { ...current.screens.start, videoUrl } },
                  }))
                }
              />
              </details>
            </section>
          ) : null}

          {step === 2 ? (
            <section className={styles.card}>
              <h2>スポット設定</h2>
              <p className={styles.lead}>巡る場所を追加します。QRは保存したあとに発行されます。</p>
              <div className={styles.spotLayout}>
                <div>
                  {spots.length === 0 ? (
                    <p className={styles.note}>まだスポットがありません。</p>
                  ) : (
                    <ol className={styles.spotList}>
                      {spots.map((spot, index) => (
                        <li
                          key={spot.key}
                          className={cn(styles.spotItem, dragIndex === index && styles["is-dragging"])}
                          draggable
                          onDragStart={() => setDragIndex(index)}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => {
                            if (dragIndex != null) reorderSpot(dragIndex, index);
                            setDragIndex(null);
                          }}
                          onDragEnd={() => setDragIndex(null)}
                        >
                          <span className={styles.index}>{index + 1}</span>
                          <button
                            type="button"
                            className={cn(styles.spotPick, index === selectedIndex && styles["is-on"])}
                            onClick={() => setSelectedIndex(index)}
                          >
                            <b>{spot.name.trim() || `スポット ${index + 1}`}</b>
                            <small>
                              {GAME_CHECKIN_LABEL[spot.checkin]}
                              {spot.required ? " ・ 必須" : " ・ 任意"}
                              {spot.lat != null ? " ・ 場所あり" : ""}
                              {spot.published ? "" : " ・ 非公開"}
                            </small>
                          </button>
                          <div className={styles.spotTools}>
                            <span className={styles.grip} aria-hidden>
                              <GripVertical className="h-4 w-4" />
                            </span>
                            <button type="button" aria-label="上へ" disabled={index === 0} onClick={() => moveSpot(index, -1)}>
                              <ArrowUp className="h-4 w-4" aria-hidden />
                            </button>
                            <button
                              type="button"
                              aria-label="下へ"
                              disabled={index === spots.length - 1}
                              onClick={() => moveSpot(index, 1)}
                            >
                              <ArrowDown className="h-4 w-4" aria-hidden />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                  <p className={styles.note}>ドラッグしても、上下ボタンでも並べ替えられます。</p>
                  <div className="mt-3">
                    <button type="button" className={styles.add} onClick={addSpot} disabled={spots.length >= MAX_ORGANIZER_GAME_SPOTS}>
                      <Plus className="h-3.5 w-3.5" aria-hidden />
                      スポットを追加
                    </button>
                  </div>
                </div>

                {selectedSpot ? (
                  <div className="org-store-intro__grid">
                    <GameImageField
                      label="スポットの写真"
                      url={selectedSpot.imageUrl ?? ""}
                      gameId={savedGameId}
                      onChange={(imageUrl) => updateSpot(selectedSpot.key, { imageUrl })}
                    />
                    <GameVideoField
                      label="スポットの動画"
                      url={selectedSpot.videoUrl ?? ""}
                      gameId={savedGameId}
                      onChange={(videoUrl) => updateSpot(selectedSpot.key, { videoUrl })}
                    />
                    <label className="org-store-intro__field org-store-intro__field--full">
                      <span>スポット名</span>
                      <input
                        value={selectedSpot.name}
                        maxLength={40}
                        onChange={(e) => updateSpot(selectedSpot.key, { name: e.target.value })}
                      />
                    </label>
                    <label className="org-store-intro__field">
                      <span>種別</span>
                      <select
                        value={selectedSpot.kind}
                        onChange={(e) =>
                          updateSpot(selectedSpot.key, { kind: e.target.value as OrganizerGameSpotKind })
                        }
                      >
                        {Object.entries(ORGANIZER_GAME_SPOT_KIND_LABEL).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="org-store-intro__field">
                      <span>チェックイン</span>
                      <select
                        value={selectedSpot.checkin}
                        onChange={(e) =>
                          updateSpot(selectedSpot.key, {
                            checkin: e.target.value as DraftSpot["checkin"],
                          })
                        }
                      >
                        {GAME_CHECKIN_METHODS.map((method) => (
                          <option key={method} value={method}>
                            {GAME_CHECKIN_LABEL[method]}
                          </option>
                        ))}
                      </select>
                    </label>
                    {selectedSpot.checkin === "gps" ? (
                      <label className="org-store-intro__field">
                        <span>判定半径（m）</span>
                        <select
                          value={
                            (GAME_CHECKIN_RADIUS_PRESETS as readonly number[]).includes(selectedSpot.radiusM)
                              ? String(selectedSpot.radiusM)
                              : "custom"
                          }
                          onChange={(e) => {
                            if (e.target.value === "custom") {
                              updateSpot(selectedSpot.key, { radiusM: 40 });
                              return;
                            }
                            updateSpot(selectedSpot.key, { radiusM: Number(e.target.value) });
                          }}
                        >
                          {GAME_CHECKIN_RADIUS_PRESETS.map((radius) => (
                            <option key={radius} value={radius}>
                              {radius}m
                            </option>
                          ))}
                          <option value="custom">任意</option>
                        </select>
                        <small>この半径の中にいるときだけ押せます。ピンがないときは、QRを読むだけで押せます。</small>
                      </label>
                    ) : null}
                    {selectedSpot.checkin === "gps" &&
                    !(GAME_CHECKIN_RADIUS_PRESETS as readonly number[]).includes(selectedSpot.radiusM) ? (
                      <label className="org-store-intro__field">
                        <span>任意の半径</span>
                        <input
                          type="number"
                          min={5}
                          max={500}
                          value={selectedSpot.radiusM}
                          onChange={(e) => updateSpot(selectedSpot.key, { radiusM: Number(e.target.value) })}
                        />
                      </label>
                    ) : null}
                    {selectedSpot.checkin === "keyword" ? (
                      <label className="org-store-intro__field org-store-intro__field--full">
                        <span>正解キーワード</span>
                        <input
                          value={selectedSpot.keyword}
                          maxLength={40}
                          onChange={(e) => updateSpot(selectedSpot.key, { keyword: e.target.value })}
                        />
                        <small>この言葉を入れるとスタンプが押されます。空欄のときは、QRを読むだけで押せます。</small>
                      </label>
                    ) : null}
                    <label className="org-store-intro__field org-store-intro__field--full">
                      <span>説明</span>
                      <textarea
                        value={selectedSpot.description}
                        maxLength={200}
                        rows={3}
                        onChange={(e) => updateSpot(selectedSpot.key, { description: e.target.value })}
                      />
                    </label>
                    <label className="org-store-intro__field org-store-intro__field--full">
                      <span>ヒント</span>
                      <input
                        value={selectedSpot.hint}
                        maxLength={120}
                        onChange={(e) => updateSpot(selectedSpot.key, { hint: e.target.value })}
                      />
                    </label>
                    <SpotPinField
                      lat={selectedSpot.lat}
                      lng={selectedSpot.lng}
                      onChange={(place) =>
                        updateSpot(selectedSpot.key, {
                          lat: place?.lat ?? null,
                          lng: place?.lng ?? null,
                        })
                      }
                    />
                    <div className={styles.switches}>
                      <button
                        type="button"
                        className={styles.switch}
                        aria-pressed={selectedSpot.required}
                        onClick={() => updateSpot(selectedSpot.key, { required: !selectedSpot.required })}
                      >
                        必須スポット
                        <em>{selectedSpot.required ? "必須" : "任意"}</em>
                      </button>
                      <button
                        type="button"
                        className={styles.switch}
                        aria-pressed={selectedSpot.published}
                        onClick={() => updateSpot(selectedSpot.key, { published: !selectedSpot.published })}
                      >
                        公開
                        <em>{selectedSpot.published ? "公開" : "非公開"}</em>
                      </button>
                    </div>
                    <button type="button" className={styles.secondary} onClick={() => removeSpot(selectedIndex)}>
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      このスポットを削除
                    </button>
                  </div>
                ) : (
                  <p className={styles.note}>スポットを追加すると、ここに詳細が出ます。</p>
                )}
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section className={styles.card}>
              <h2>画面・演出設定</h2>
              <p className={styles.lead}>参加者が最初に見るスタート画面から作れます。</p>
              <div className={styles.tabs} role="tablist">
                {GAME_SCREEN_IDS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={screen === id}
                    className={cn(screen === id && styles["is-on"])}
                    onClick={() => setScreen(id)}
                  >
                    {GAME_SCREEN_LABEL[id]}
                  </button>
                ))}
              </div>

              {screen === "start" ? (
                <div className="org-store-intro__grid">
                  <label className="org-store-intro__field org-store-intro__field--full">
                    <span>タイトル</span>
                    <input
                      value={experience.screens.start.title}
                      maxLength={40}
                      placeholder={name || "春のまち歩きスタンプラリー"}
                      onChange={(e) =>
                        patchExperience((current) => ({
                          ...current,
                          screens: { ...current.screens, start: { ...current.screens.start, title: e.target.value } },
                        }))
                      }
                    />
                  </label>
                  <label className="org-store-intro__field org-store-intro__field--full">
                    <span>キャッチコピー</span>
                    <textarea
                      value={experience.screens.start.catchCopy}
                      maxLength={80}
                      rows={2}
                      placeholder="5つのスポットを巡って、春のまちを発見しよう！"
                      onChange={(e) =>
                        patchExperience((current) => ({
                          ...current,
                          screens: {
                            ...current.screens,
                            start: { ...current.screens.start, catchCopy: e.target.value },
                          },
                        }))
                      }
                    />
                  </label>
                  <label className="org-store-intro__field org-store-intro__field--full">
                    <span>説明文</span>
                    <textarea
                      value={experience.screens.start.description}
                      maxLength={200}
                      rows={3}
                      onChange={(e) =>
                        patchExperience((current) => ({
                          ...current,
                          screens: {
                            ...current.screens,
                            start: { ...current.screens.start, description: e.target.value },
                          },
                        }))
                      }
                    />
                  </label>
                  <div className="org-store-intro__field org-store-intro__field--full">
                    <span>遊び方</span>
                    <div className={styles.howto}>
                      {experience.screens.start.steps.map((item, index) => (
                        <div key={`${item.icon}-${index}`} className={styles.howtoRow}>
                          <select
                            value={item.icon}
                            aria-label={`遊び方${index + 1}のアイコン`}
                            onChange={(e) =>
                              patchExperience((current) => ({
                                ...current,
                                screens: {
                                  ...current.screens,
                                  start: {
                                    ...current.screens.start,
                                    steps: current.screens.start.steps.map((stepItem, stepIndex) =>
                                      stepIndex === index
                                        ? { ...stepItem, icon: e.target.value as GameHowtoIcon }
                                        : stepItem
                                    ),
                                  },
                                },
                              }))
                            }
                          >
                            {GAME_HOWTO_ICONS.map((icon) => (
                              <option key={icon} value={icon}>
                                {GAME_HOWTO_ICON_LABEL[icon]}
                              </option>
                            ))}
                          </select>
                          <input
                            value={item.label}
                            maxLength={24}
                            aria-label={`遊び方${index + 1}`}
                            onChange={(e) =>
                              patchExperience((current) => ({
                                ...current,
                                screens: {
                                  ...current.screens,
                                  start: {
                                    ...current.screens.start,
                                    steps: current.screens.start.steps.map((stepItem, stepIndex) =>
                                      stepIndex === index ? { ...stepItem, label: e.target.value } : stepItem
                                    ),
                                  },
                                },
                              }))
                            }
                          />
                          <button
                            type="button"
                            className={styles.iconBtn}
                            aria-label="この手順を削除"
                            onClick={() =>
                              patchExperience((current) => ({
                                ...current,
                                screens: {
                                  ...current.screens,
                                  start: {
                                    ...current.screens.start,
                                    steps: current.screens.start.steps.filter((_, stepIndex) => stepIndex !== index),
                                  },
                                },
                              }))
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        </div>
                      ))}
                      {experience.screens.start.steps.length < 5 ? (
                        <button
                          type="button"
                          className={styles.add}
                          onClick={() =>
                            patchExperience((current) => ({
                              ...current,
                              screens: {
                                ...current.screens,
                                start: {
                                  ...current.screens.start,
                                  steps: [...current.screens.start.steps, { icon: "pin", label: "" }],
                                },
                              },
                            }))
                          }
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden />
                          手順を追加
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <label className="org-store-intro__field org-store-intro__field--full">
                    <span>開始ボタン</span>
                    <input
                      value={experience.screens.start.buttonLabel}
                      maxLength={20}
                      onChange={(e) =>
                        patchExperience((current) => ({
                          ...current,
                          screens: {
                            ...current.screens,
                            start: { ...current.screens.start, buttonLabel: e.target.value },
                          },
                        }))
                      }
                    />
                  </label>
                  <div className={cn(styles.switches, "org-store-intro__field--full")}>
                    {(
                      [
                        ["showCharacter", "キャラクターを表示"],
                        ["showFreeBadge", "参加無料バッジ"],
                        ["showPeriod", "開催期間"],
                        ["showShare", "シェアボタン"],
                      ] as const
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        className={styles.switch}
                        aria-pressed={experience.screens.start[key]}
                        onClick={() =>
                          patchExperience((current) => ({
                            ...current,
                            screens: {
                              ...current.screens,
                              start: { ...current.screens.start, [key]: !current.screens.start[key] },
                            },
                          }))
                        }
                      >
                        {label}
                        <em>{experience.screens.start[key] ? "表示" : "非表示"}</em>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {screen === "spot" ? (
                <label className="org-store-intro__field">
                  <span>スポット画面の紹介</span>
                  <textarea
                    value={experience.screens.spot.intro}
                    maxLength={200}
                    rows={4}
                    placeholder="この神社は、まちの春の目印です。"
                    onChange={(e) =>
                      patchExperience((current) => ({
                        ...current,
                        screens: { ...current.screens, spot: { intro: e.target.value } },
                      }))
                    }
                  />
                  <small>各スポットの説明は、スポット設定の文章が優先されます。</small>
                </label>
              ) : null}

              {screen === "stamp" ? (
                <div className="org-store-intro__grid">
                  <GameImageField
                    label="スタンプの絵"
                    url={experience.screens.stamp.imageUrl}
                    gameId={savedGameId}
                    onChange={(imageUrl) =>
                      patchExperience((current) => ({
                        ...current,
                        screens: {
                          ...current.screens,
                          stamp: { ...current.screens.stamp, imageUrl },
                        },
                      }))
                    }
                  />
                  <label className="org-store-intro__field org-store-intro__field--full">
                    <span>獲得メッセージ</span>
                    <input
                      value={experience.screens.stamp.message}
                      maxLength={40}
                      placeholder="スタンプGET！"
                      onChange={(e) =>
                        patchExperience((current) => ({
                          ...current,
                          screens: {
                            ...current.screens,
                            stamp: { ...current.screens.stamp, message: e.target.value },
                          },
                        }))
                      }
                    />
                  </label>
                  <label className="org-store-intro__field">
                    <span>アニメーション</span>
                    <select
                      value={experience.screens.stamp.animation}
                      onChange={(e) =>
                        patchExperience((current) => ({
                          ...current,
                          screens: {
                            ...current.screens,
                            stamp: {
                              ...current.screens.stamp,
                              animation: e.target.value as GameExperience["screens"]["stamp"]["animation"],
                            },
                          },
                        }))
                      }
                    >
                      {GAME_STAMP_ANIMATIONS.map((animation) => (
                        <option key={animation} value={animation}>
                          {GAME_STAMP_ANIMATION_LABEL[animation]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="org-store-intro__field">
                    <span>音</span>
                    <select
                      value={experience.screens.stamp.sound}
                      onChange={(e) =>
                        patchExperience((current) => ({
                          ...current,
                          screens: {
                            ...current.screens,
                            stamp: {
                              ...current.screens.stamp,
                              sound: e.target.value as GameExperience["screens"]["stamp"]["sound"],
                            },
                          },
                        }))
                      }
                    >
                      {GAME_STAMP_SOUNDS.map((sound) => (
                        <option key={sound} value={sound}>
                          {GAME_STAMP_SOUND_LABEL[sound]}
                        </option>
                      ))}
                    </select>
                    <small>自分の音声を置かないときは、この音が鳴ります。</small>
                  </label>
                  <GameAudioField
                    label="自分の音声"
                    url={experience.screens.stamp.soundUrl}
                    gameId={savedGameId}
                    onChange={(soundUrl) =>
                      patchExperience((current) => ({
                        ...current,
                        screens: { ...current.screens, stamp: { ...current.screens.stamp, soundUrl } },
                      }))
                    }
                  />
                </div>
              ) : null}

              {screen === "clear" ? (
                <div className="org-store-intro__grid">
                  <label className="org-store-intro__field org-store-intro__field--full">
                    <span>タイトル</span>
                    <input
                      value={experience.screens.clear.title}
                      maxLength={40}
                      placeholder="コンプリート！"
                      onChange={(e) =>
                        patchExperience((current) => ({
                          ...current,
                          screens: { ...current.screens, clear: { ...current.screens.clear, title: e.target.value } },
                        }))
                      }
                    />
                  </label>
                  <label className="org-store-intro__field org-store-intro__field--full">
                    <span>メッセージ</span>
                    <textarea
                      value={experience.screens.clear.message}
                      maxLength={120}
                      rows={3}
                      placeholder="5つのスポットを全部巡りました！"
                      onChange={(e) =>
                        patchExperience((current) => ({
                          ...current,
                          screens: {
                            ...current.screens,
                            clear: { ...current.screens.clear, message: e.target.value },
                          },
                        }))
                      }
                    />
                  </label>
                </div>
              ) : null}
            </section>
          ) : null}

          {step === 4 ? (
            <section className={styles.card}>
              <h2>達成条件・特典</h2>
              <p className={styles.lead}>まずは1つの条件と、特典の名前だけ残せます。</p>
              <div className={styles.group} role="radiogroup" aria-label="達成条件">
                <p>達成条件</p>
                <div className={styles.choices}>
                  <button
                    type="button"
                    className={cn(styles.choice, experience.condition.mode === "all" && styles["is-on"])}
                    aria-pressed={experience.condition.mode === "all"}
                    onClick={() =>
                      patchExperience((current) => ({
                        ...current,
                        condition: { ...current.condition, mode: "all" },
                      }))
                    }
                  >
                    全スポット達成
                  </button>
                  <button
                    type="button"
                    className={cn(styles.choice, experience.condition.mode === "count" && styles["is-on"])}
                    aria-pressed={experience.condition.mode === "count"}
                    onClick={() =>
                      patchExperience((current) => ({
                        ...current,
                        condition: { ...current.condition, mode: "count" },
                      }))
                    }
                  >
                    指定した数以上
                  </button>
                </div>
                {experience.condition.mode === "all" ? (
                  <p className={styles.note}>任意のスポットは、クリアの条件に入りません。</p>
                ) : null}
              </div>
              {experience.condition.mode === "count" ? (
                <label className="org-store-intro__field mt-3">
                  <span>必要なスポット数</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={experience.condition.requiredCount}
                    onChange={(e) =>
                      patchExperience((current) => ({
                        ...current,
                        condition: { ...current.condition, requiredCount: Number(e.target.value) },
                      }))
                    }
                  />
                  <small>この数まで押すと、クリアになります。</small>
                </label>
              ) : null}
              <div className={styles.group} role="radiogroup" aria-label="特典の種類">
                <p>特典の種類</p>
                <div className={cn(styles.choices, styles.choicesPairs)}>
                  {GAME_REWARD_KINDS.map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      className={cn(styles.choice, experience.reward.kind === kind && styles["is-on"])}
                      aria-pressed={experience.reward.kind === kind}
                      onClick={() =>
                        patchExperience((current) => ({
                          ...current,
                          reward: { ...current.reward, kind },
                        }))
                      }
                    >
                      {GAME_REWARD_KIND_LABEL[kind]}
                    </button>
                  ))}
                </div>
              </div>
              <label className="org-store-intro__field mt-3">
                <span>特典の名前</span>
                <input
                  value={experience.reward.label}
                  maxLength={40}
                  placeholder="例: まち歩きクーポン"
                  onChange={(e) =>
                    patchExperience((current) => ({
                      ...current,
                      reward: { ...current.reward, label: e.target.value },
                    }))
                  }
                />
                <small>クリア画面に、種類と名前が出ます。</small>
              </label>
              {experience.reward.kind === "coupon" ? (
                <label className="org-store-intro__field mt-3">
                  <span>見せるコード</span>
                  <input
                    value={experience.reward.code}
                    maxLength={24}
                    placeholder="例: HARU2026"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                    onChange={(e) =>
                      patchExperience((current) => ({
                        ...current,
                        reward: { ...current.reward, code: e.target.value },
                      }))
                    }
                  />
                  <small>クリアした人の画面に、このコードが出ます。使ったら、ゲームの編集画面で使用済みにできます。</small>
                </label>
              ) : null}
              {experience.reward.kind === "points" ? (
                <label className="org-store-intro__field mt-3">
                  <span>付与ポイント</span>
                  <input
                    type="number"
                    min={1}
                    max={9999}
                    inputMode="numeric"
                    value={experience.reward.points}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      if (!Number.isFinite(next)) return;
                      patchExperience((current) => ({
                        ...current,
                        reward: { ...current.reward, points: Math.min(9999, Math.max(1, Math.round(next))) },
                      }));
                    }}
                  />
                  <small>クリアすると、ログイン中のアカウントに入ります。ログイン前でも、あとから受け取れます。</small>
                </label>
              ) : null}
              {experience.reward.kind === "badge" ? (
                <div className="mt-3">
                  <GameImageField
                    label="バッジの絵"
                    url={experience.reward.imageUrl}
                    gameId={savedGameId}
                    onChange={(imageUrl) =>
                      patchExperience((current) => ({
                        ...current,
                        reward: { ...current.reward, imageUrl },
                      }))
                    }
                  />
                  <small className={styles.note}>絵がないときは、特典の名前が入った丸いメダルになります。</small>
                </div>
              ) : null}
            </section>
          ) : null}

          {step === 5 ? (
            <section className={styles.card}>
              <h2>確認・公開</h2>
              <p className={styles.lead}>
                {published
                  ? "公開中です。直した内容は、変更を保存すると参加画面に反映されます。スポットの追加と削除は、参加が始まる前だけできます。"
                  : "公開すると、参加用QRから入れるようになります。未設定の項目を押すと、そのステップに戻ります。"}
              </p>
              <ul className={styles.checks}>
                {checks.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={cn(item.done && styles["is-done"])}
                      onClick={() => {
                        setStep(item.step);
                        if (item.screen) setScreen(item.screen);
                        setNotice(null);
                      }}
                    >
                      <span className={styles.mark}>{item.done ? <Check className="h-3 w-3" aria-hidden /> : "!"}</span>
                      <b>{item.label}</b>
                      <em>{item.done ? "設定済み" : "未設定"}</em>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {error ? <p className="org-store-intro__error">{error}</p> : null}
          {notice ? <p className={styles.notice}>{notice}</p> : null}
          <p className={styles.types}>
            ほかの種類：
            {otherTypes.map((type) => (
              <Link key={type.id} href={`/organizer/games/new?type=${type.id}`}>
                {type.label}
              </Link>
            ))}
          </p>
        </div>

        <StampRallyPreview
          screen={previewScreen}
          name={name}
          periodLabel={periodLabel}
          spots={spots.map((spot) => ({
            name: spot.name,
            description: spot.description,
            imageUrl: spot.imageUrl ?? "",
            hasPlace: spot.lat != null && spot.lng != null,
          }))}
          experience={experience}
        />
      </div>

      <div className={styles.footer}>
        <div className={styles.footerQuiet}>
          {step > 1 ? (
            <button
              type="button"
              className={styles.textAction}
              disabled={saving}
              onClick={() => {
                setStep((current) => (current > 1 ? ((current - 1) as Step) : current));
                setNotice(null);
              }}
            >
              戻る
            </button>
          ) : null}
          <button type="button" className={styles.textAction} disabled={saving} onClick={() => setTesting(true)}>
            お試しで見る
          </button>
          <button type="button" className={styles.textAction} disabled={saving} onClick={() => void saveDraft("stay")}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
            下書き保存
          </button>
        </div>
        <button
          type="button"
          className={styles.primary}
          disabled={saving}
          onClick={() => void saveDraft(step === 5 ? "publish" : "next")}
        >
          {step === 5 ? (published ? "変更を保存" : "公開する") : "保存して次へ"}
        </button>
      </div>
      {testing ? (
        <StampRallyTestPlay
          name={name}
          periodLabel={periodLabel}
          experience={experience}
          spots={spots}
          onClose={() => setTesting(false)}
        />
      ) : null}
    </div>
  );
}
