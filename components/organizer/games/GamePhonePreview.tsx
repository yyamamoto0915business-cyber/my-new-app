"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Award, ImagePlus, Palette, Plus, Shapes, Type, Video } from "lucide-react";
import { PlayLocaleSwitch } from "@/components/play/PlayLocaleSwitch";
import { PlayCheckin } from "@/components/play/PlayCheckin";
import { PlayCoupon } from "@/components/play/PlayCoupon";
import { PlayMission } from "@/components/play/PlayMission";
import { PlayMystery } from "@/components/play/PlayMystery";
import { PlayPhoto } from "@/components/play/PlayPhoto";
import { PlayQuiz } from "@/components/play/PlayQuiz";
import { usePlayCopy } from "@/components/play/usePlayCopy";
import { QuizPreviewEditor, type QuizPreviewEdit } from "@/components/organizer/games/QuizPreviewEditor";
import {
  GameLookEditPanel,
  GameLookImagePanel,
  GameLookBlockPanel,
  GameLookTextPanel,
  type GameLookSelection,
} from "@/components/organizer/games/GameLookEditPanel";
import { FloatingPanel } from "@/components/organizer/games/FloatingPanel";
import { StartImagePicker } from "@/components/organizer/games/StartImagePicker";
import { ShapeEditPanel, ShapePicker } from "@/components/organizer/games/ShapeTools";
import {
  START_IMAGE_MAX,
  START_VIDEO_MAX,
  START_SHAPE_DEFAULT_WIDTH,
  START_SHAPE_MAX,
  START_TEXT_MAX,
  type GameShapeKind,
  type GameStartImage,
  type GameStartShape,
  type StartOffset,
} from "@/lib/organizer/game-experience";
import {
  GameLookBackdrop,
  GameLookIconMark,
  GameStartHeader,
  gameLookClass,
  ClearLayer,
  GameSceneBand,
  PlayLookHead,
  gamePlayProgress,
  type GameStartHeaderEdit,
} from "@/components/play/GameLook";
import {
  DEFAULT_EXTRA_TEXT_COLOR,
  DEFAULT_GAME_LOOK,
  FINE_DEFAULT,
  fineIsDefault,
  lookForScreen,
  GAME_LOOK_TEXT_KEYS,
  type GameLook,
  type GameLookExtraText,
  type GameLookTextStyle,
  type GameLookTextKey,
} from "@/lib/organizer/game-look";
import { publicCheckin, readStoredCheckin } from "@/lib/organizer/checkin-play";
import { sanitizeCheckinSettings } from "@/lib/organizer/checkin";
import { readStoredCoupon } from "@/lib/organizer/coupon-play";
import { sanitizeCouponSettings } from "@/lib/organizer/coupon";
import { publicMission, readStoredMission } from "@/lib/organizer/mission-play";
import { sanitizeMissionSettings } from "@/lib/organizer/mission";
import { publicMystery, readStoredMystery } from "@/lib/organizer/mystery-play";
import { sanitizeMysterySettings } from "@/lib/organizer/mystery";
import { readStoredPhoto } from "@/lib/organizer/photo-play";
import { sanitizePhotoSettings } from "@/lib/organizer/photo";
import { publicQuiz, readStoredQuiz } from "@/lib/organizer/quiz-play";
import type { PlayProgress } from "@/lib/organizer/play-types";
import { cn } from "@/lib/utils";
import "./wizard-preview.css";

/** iPhone 14/15 の画面（CSS ピクセル）と、枠の太さ。スタンプラリーのプレビューと同じ。 */
const SCREEN_W = 390;
const SCREEN_H = 844;
const BEZEL = 12;
const PHONE_W = SCREEN_W + BEZEL * 2;
const PHONE_H = SCREEN_H + BEZEL * 2;

export type GameLookEdit = {
  value: GameLook;
  onChange: (look: GameLook) => void;
  /** いまの値から作り直す（ドラッグ中など、続けて変えるとき）。 */
  update: (fn: (current: GameLook) => GameLook) => void;
  /** 背景の写真の選択欄。 */
  bgImageField: ReactNode;
  /** アイコンに使う写真のアップロード欄。 */
  uploadField: (onUploaded: (url: string) => void) => ReactNode;
  /** 挿入する動画のアップロード欄。 */
  videoField: (onUploaded: (url: string) => void) => ReactNode;
};

export type GamePreviewKind = "quiz" | "mission" | "photo" | "coupon" | "checkin" | "mystery";
export type GamePreviewView = "start" | "play" | "clear";

const VIEWS: { id: GamePreviewView; label: string }[] = [
  { id: "start", label: "参加" },
  { id: "play", label: "プレイ中" },
  { id: "clear", label: "クリア" },
];

/**
 * 見本の進み具合。プレイ中は focus の手前まで（なければ半分）済み、クリアは全部済み。
 * プレイ中はクリアの数（needed）に届かないところまでにして、クリアの画面にならないようにする。
 */
function sampleDone(total: number, view: GamePreviewView, needed: number, focus?: number): number[] {
  if (view === "start") return [];
  if (view === "clear") return Array.from({ length: total }, (_, index) => index);
  const half = focus != null ? Math.min(Math.max(focus, 0), Math.max(total - 1, 0)) : Math.floor(total / 2);
  const upto = Math.min(half, Math.max(needed - 1, 0));
  return Array.from({ length: upto }, (_, index) => index);
}

/**
 * 好きな順に選べる一覧のゲーム（ミッション・フォト・チェックイン・クーポン）。
 * 済んだ項目は開けないので、プレイ中はどれも済んでいないことにして、すべての項目の画面を開いて直せるようにする。
 */
function listDone(total: number, view: GamePreviewView, needed: number, focus?: number): number[] {
  return view === "play" ? [] : sampleDone(total, view, needed, focus);
}

type Built = { total: number; meta: string; screen: (progress: PlayProgress | null) => ReactNode; progress: PlayProgress };

const noop = () => undefined;
const TOKEN = "organizer-preview";

/**
 * スタンプラリー以外のゲームの、参加者が実際に見る画面をスマホ枠の中に出す。
 * 保存するときと同じ設定から、参加画面と同じ部品で描く。
 */
/** 参加フォームの入力欄の見た目だけ（入力はできない）。CSS ファイルの反映待ちに左右されないよう、直接指定する。 */
const FAKE_FIELD: CSSProperties = {
  display: "grid",
  gap: "0.3rem",
  fontSize: "0.75rem",
  fontWeight: 700,
  color: "#1a4d32",
};
const FAKE_BOX: CSSProperties = {
  display: "block",
  boxSizing: "border-box",
  width: "100%",
  minHeight: 44,
  border: "1px solid #d5e2d8",
  borderRadius: "0.8rem",
  background: "#fbfdfb",
};
const FAKE_SHOW: CSSProperties = {
  position: "absolute",
  top: "50%",
  right: "0.85rem",
  transform: "translateY(-50%)",
  color: "#2d7a4f",
  fontSize: "0.78rem",
  fontWeight: 700,
};

export function GamePhonePreview({
  kind,
  typeLabel,
  name,
  description,
  settings,
  focus,
  stepView,
  edit,
  look: lookEdit,
}: {
  /** 渡すと、プレビューの上で直接書き換えられる（いまはクイズ）。 */
  edit?: {
    onName: (value: string) => void;
    onDescription: (value: string) => void;
    quiz?: QuizPreviewEdit;
  };
  /** 渡すと、プレビューの上で参加画面のアイコンと背景を変えられる。 */
  look?: GameLookEdit;
  kind: GamePreviewKind;
  typeLabel: string;
  name: string;
  description: string;
  /** 保存のときに送る、種類ごとの設定（例：クイズなら body.quiz）。 */
  settings: unknown;
  /** プレイ中に見せる問題・項目の番号。 */
  focus?: number;
  /** 作成中のステップに合わせて見せる画面。 */
  stepView?: GamePreviewView;
}) {
  const copy = usePlayCopy();
  const [view, setView] = useState<GamePreviewView>(stepView ?? "start");
  useEffect(() => {
    if (stepView) setView(stepView);
  }, [stepView]);
  // 問題を選び直したら、その問題を見せる（最初の表示では変えない）。
  const lastFocus = useRef(focus);
  useEffect(() => {
    if (focus == null || focus === lastFocus.current) return;
    lastFocus.current = focus;
    setView("play");
  }, [focus]);

  const built: Built | null = useMemo(() => {
    const base = (total: number, done: number[]): PlayProgress => ({
      nickname: "プレビュー",
      stampedCount: done.length,
      spotCount: total,
      completed: false,
      spots: [],
    });
    if (kind === "quiz") {
      const stored = readStoredQuiz({ quiz: settings });
      if (!stored) return null;
      const quiz = publicQuiz(stored);
      const total = stored.questions.length;
      const done = sampleDone(total, view, stored.clearCount, focus);
      const completed = done.length >= stored.clearCount;
      return {
        total,
        meta: copy.quizMeta(total, stored.clearCount),
        progress: {
          ...base(total, done),
          completed,
          rewardCode: completed && (stored.couponOn || stored.prizeOn) ? "MG-0000" : undefined,
          quizRank: completed && stored.rankingOn ? 1 : undefined,
          quiz: { needed: stored.clearCount, solved: done, rewards: stored.rewards },
        },
        screen: (progress) =>
          progress ? <PlayQuiz key={view} token={TOKEN} quiz={quiz} progress={progress} onProgress={noop} /> : null,
      };
    }
    if (kind === "mission") {
      const clean = sanitizeMissionSettings(settings);
      const stored = clean ? readStoredMission({ mission: clean }) : null;
      if (!clean || !stored) return null;
      const mission = publicMission(stored, clean.publish.hints);
      const total = stored.missions.length;
      const done = listDone(total, view, stored.clearCount, focus);
      const completed = done.length >= stored.clearCount;
      const points = stored.pointsOn
        ? stored.missions.filter((item) => done.includes(item.index)).reduce((sum, item) => sum + item.pointAmount, 0)
        : 0;
      return {
        total,
        meta: copy.missionMeta(total, stored.clearCount),
        progress: {
          ...base(total, done),
          completed,
          rewardPoints: completed && points > 0 ? points : undefined,
          mission: { needed: stored.clearCount, done, rewards: stored.rewards },
        },
        screen: (progress) =>
          progress ? <PlayMission key={view} token={TOKEN} mission={mission} progress={progress} onProgress={noop} /> : null,
      };
    }
    if (kind === "photo") {
      const clean = sanitizePhotoSettings(settings);
      const photo = clean ? readStoredPhoto({ photo: clean }) : null;
      if (!photo) return null;
      const total = photo.spots.length;
      const done = listDone(total, view, photo.clearCount, focus);
      const completed = done.length >= photo.clearCount;
      return {
        total,
        meta: copy.photoMeta(total, photo.clearCount),
        progress: {
          ...base(total, done),
          completed,
          rewardPoints: completed && photo.pointAmount > 0 ? photo.pointAmount : undefined,
          rewardCode: done.length >= photo.clearCount && (photo.couponOn || photo.prizeOn) ? "MG-0000" : undefined,
          photo: { needed: photo.clearCount, done, rewards: photo.rewards },
        },
        screen: (progress) =>
          progress ? <PlayPhoto key={view} token={TOKEN} photo={photo} progress={progress} onProgress={noop} /> : null,
      };
    }
    if (kind === "coupon") {
      const clean = sanitizeCouponSettings(settings);
      const coupon = clean ? readStoredCoupon({ coupon: clean }) : null;
      if (!coupon) return null;
      const total = coupon.stores.length;
      const done = listDone(total, view, coupon.needed, focus);
      const completed = done.length >= coupon.needed;
      return {
        total,
        meta: copy.couponMeta(total, coupon.needed),
        progress: {
          ...base(total, done),
          completed,
          rewardCode: completed && coupon.autoGrant ? "MG-0000" : undefined,
          coupon: { needed: coupon.needed, done, autoGrant: coupon.autoGrant, noStack: coupon.noStack },
        },
        screen: (progress) =>
          progress ? <PlayCoupon key={view} token={TOKEN} coupon={coupon} progress={progress} onProgress={noop} /> : null,
      };
    }
    if (kind === "checkin") {
      const clean = sanitizeCheckinSettings(settings);
      const stored = clean ? readStoredCheckin({ checkin: clean }) : null;
      if (!stored) return null;
      const checkin = publicCheckin(stored);
      const total = stored.spots.length;
      const done = listDone(total, view, stored.needed, focus);
      const completed = done.length >= stored.needed;
      return {
        total,
        meta: copy.checkinMeta(total, stored.needed),
        progress: {
          ...base(total, done),
          completed,
          rewardPoints: completed && stored.pointAmount > 0 ? stored.pointAmount : undefined,
          rewardCode: completed && (stored.couponOn || stored.prizeOn) ? "MG-0000" : undefined,
          quizRank: completed && stored.rankingOn ? 1 : undefined,
          checkin: { needed: stored.needed, done, rewards: stored.rewards },
        },
        screen: (progress) =>
          progress ? <PlayCheckin key={view} token={TOKEN} checkin={checkin} progress={progress} onProgress={noop} /> : null,
      };
    }
    const clean = sanitizeMysterySettings(settings);
    const stored = clean ? readStoredMystery({ mystery: clean }) : null;
    if (!stored) return null;
    const mystery = publicMystery(stored);
    const total = stored.steps.length;
    const done = sampleDone(total, view, stored.needed, focus);
    return {
      total,
      meta: copy.mysteryMeta(total, stored.needed),
      progress: {
        ...base(total, done),
        completed: done.length >= stored.needed,
        rewardCode: done.length >= stored.needed && (stored.couponOn || stored.prizeOn) ? "MG-0000" : undefined,
        mystery: { needed: stored.needed, solved: done, rewards: stored.rewards },
      },
      screen: (progress) =>
        progress ? <PlayMystery key={view} token={TOKEN} mystery={mystery} progress={progress} onProgress={noop} /> : null,
    };
  }, [kind, settings, view, focus, copy]);

  // 実機（390×844）の大きさで描き、置き場所に収まるよう縮める。
  const stageRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(0.7);
  const [actual, setActual] = useState(false);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const { width, height } = stage.getBoundingClientRect();
      const next = Math.min(1, (width - 4) / PHONE_W, (height - 4) / PHONE_H);
      if (next > 0) setFitScale(Math.round(next * 100) / 100);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);
  const scale = actual ? 1 : fitScale;
  const title = name.trim() || typeLabel;

  const look = {
    ...(lookEdit?.value ?? DEFAULT_GAME_LOOK), extraTexts: lookEdit?.value?.extraTexts ?? [],
    screens: lookEdit?.value?.screens ?? {},
    blocks: lookEdit?.value?.blocks ?? {},
  };
  const [lookSel, setLookSel] = useState<GameLookSelection | null>(null);
  const [pickingIcon, setPickingIcon] = useState(false);
  /** 「挿入」で開く欄（図形か画像）。 */
  const [inserting, setInserting] = useState<"shape" | "image" | "video" | null>(null);
  /** ドラッグで動かす部品のうち、いま選んでいるもの（足した図形は shape:<id>）。 */
  const [activeMove, setActiveMove] = useState<string | null>(null);
  /** 設定パネルを出す側。選んだものが画面の下半分にあるときは上に出して、隠れないようにする。 */
  const [panelPlace, setPanelPlace] = useState<"top" | "bottom">("bottom");
  useEffect(() => {
    if (!activeMove) return;
    const place = () => {
      const stage = stageRef.current;
      const target =
        stage?.querySelector(`[data-move="${activeMove}"]`) ?? (activeMove === "button" ? stage?.querySelector(".play-dock") : null);
      if (!target) {
        setPanelPlace("bottom");
        return;
      }
      const rect = target.getBoundingClientRect();
      setPanelPlace(rect.top + rect.height / 2 > window.innerHeight / 2 ? "top" : "bottom");
    };
    // 選択の枠が付いてから測る。ドラッグで動かしたあとも測り直す。
    const id = window.requestAnimationFrame(place);
    window.addEventListener("resize", place);
    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener("resize", place);
    };
  }, [activeMove, look.offsets]);
  /** 選んでいる部品の画面上の要素（ポップアップを近くに出すため）。 */
  const getFabAnchor = (name: string) => stageRef.current?.querySelector(`[data-fab="${name}"]`) ?? null;
  const getMoveAnchor = () =>
    stageRef.current?.querySelector(`[data-move="${activeMove}"]`) ??
    (activeMove === "button" ? stageRef.current?.querySelector(".play-dock") : null) ??
    null;
  const selectLook = (next: GameLookSelection | null, move: string | null = null) => {
    setPickingIcon(false);
    setInserting(null);
    setLookSel(next);
    setActiveMove(move);
  };
  // ドラッグ中は何度も呼ばれるので、いつも最新の値に足していく。
  const update = (fn: (current: GameLook) => GameLook) => lookEdit?.update(fn);
  const setOffset = (key: string, offset: StartOffset | null) =>
    update((current) => {
      const offsets = { ...current.offsets };
      if (offset) offsets[key] = offset;
      else delete offsets[key];
      return { ...current, offsets };
    });
  const patchShape = (id: string, patch: Partial<GameStartShape>) =>
    update((current) => ({
      ...current,
      shapes: current.shapes.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  /** 足したものを、いま見ている画面に出す（参加の画面は何も書かない）。 */
  const onThisScreen = (screens: GameLook["screens"], key: string): GameLook["screens"] =>
    view === "play" || view === "clear" ? { ...(screens ?? {}), [key]: view } : (screens ?? {});
  function addShape(kind: GameShapeKind) {
    if (look.shapes.length >= START_SHAPE_MAX) return;
    const id = `s${crypto.randomUUID().slice(0, 8)}`;
    update((current) => ({
      ...current,
      shapes: [
        ...current.shapes,
        {
          id,
          kind,
          color: kind === "button" ? "#1f7a4a" : "#ffffff",
          width: START_SHAPE_DEFAULT_WIDTH[kind],
          opacity: 100,
          label: kind === "button" ? "くわしく見る" : "",
          href: "",
        },
      ],
      screens: onThisScreen(current.screens, `shape:${id}`),
    }));
    selectLook(null, `shape:${id}`);
  }
  const patchText = (id: string, patch: Partial<GameLookExtraText>) =>
    update((current) => ({
      ...current,
      extraTexts: (current.extraTexts ?? []).map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  function addText() {
    if (look.extraTexts.length >= START_TEXT_MAX) return;
    const id = `t${crypto.randomUUID().slice(0, 8)}`;
    // 空だと見えないので、はじめから文字を入れておく（そのまま打つと置き換わる）。
    update((current) => ({
      ...current,
      extraTexts: [...(current.extraTexts ?? []), { ...FINE_DEFAULT, id, text: "テキスト", color: DEFAULT_EXTRA_TEXT_COLOR, bg: "" }],
      screens: onThisScreen(current.screens, `extra:${id}`),
    }));
    selectLook(null, `extra:${id}`);
    // できた入力欄を画面の中に出して、すぐ打てるようにする。
    window.setTimeout(() => {
      const box = stageRef.current?.querySelector<HTMLTextAreaElement>(`[data-move="extra:${id}"] textarea`);
      if (!box) return;
      box.scrollIntoView({ block: "center", inline: "nearest" });
      box.focus({ preventScroll: true });
      box.select();
    }, 80);
  }
  const patchImage = (id: string, patch: Partial<GameStartImage>) =>
    update((current) => ({
      ...current,
      images: current.images.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  function addImage(url: string) {
    if (!url || look.images.length >= START_IMAGE_MAX) return;
    const id = `i${crypto.randomUUID().slice(0, 8)}`;
    update((current) => ({
      ...current,
      images: [...current.images, { id, url, size: "m", round: false }],
      screens: onThisScreen(current.screens, `img:${id}`),
    }));
    selectLook(null, `img:${id}`);
  }
  function addVideo(url: string) {
    if (!url || look.images.length >= START_IMAGE_MAX) return;
    if (look.images.filter((item) => item.video).length >= START_VIDEO_MAX) return;
    const id = `v${crypto.randomUUID().slice(0, 8)}`;
    update((current) => ({
      ...current,
      images: [...current.images, { id, url, size: "l", round: false, video: true }],
      screens: onThisScreen(current.screens, `img:${id}`),
    }));
    selectLook(null, `img:${id}`);
  }
  const selectedImage = activeMove?.startsWith("img:")
    ? (look.images.find((item) => `img:${item.id}` === activeMove) ?? null)
    : null;
  const selectedText = activeMove?.startsWith("extra:")
    ? (look.extraTexts.find((item) => `extra:${item.id}` === activeMove) ?? null)
    : null;
  const selectedShape = activeMove?.startsWith("shape:")
    ? (look.shapes.find((item) => `shape:${item.id}` === activeMove) ?? null)
    : null;
  function deleteAdded(key: string) {
    update((current) => {
      const offsets = { ...current.offsets };
      delete offsets[key];
      return {
        ...current,
        offsets,
        screens: Object.fromEntries(Object.entries(current.screens ?? {}).filter(([k]) => k !== key)),
        shapes: current.shapes.filter((item) => `shape:${item.id}` !== key),
        extraTexts: (current.extraTexts ?? []).filter((item) => `extra:${item.id}` !== key),
        images: current.images.filter((item) => `img:${item.id}` !== key),
      };
    });
    selectLook(null);
  }
  const headerEdit: GameStartHeaderEdit | undefined = lookEdit
    ? {
        active: activeMove,
        onMove: setOffset,
        onSelect: (key) =>
          key.startsWith("shape:") || key.startsWith("img:") || key.startsWith("extra:")
            ? selectLook(null, key)
            : selectLook(key === "icon" ? "icon" : "text", key),
        onResize: (key, width) =>
          key.startsWith("img:") ? patchImage(key.slice(4), { width }) : patchShape(key.slice(6), { width }),
        onShapeLabel: (id, label) => patchShape(id, { label }),
        onExtraText: (id, text) => patchText(id, { text }),
        onDelete: deleteAdded,
      }
    : undefined;
  const icon = lookEdit ? (
    <button
      type="button"
      className={cn("look-edit__icon is-editable", lookSel === "icon" && "is-on")}
      aria-label="アイコンを変える"
      onClick={() => selectLook("icon", "icon")}
    >
      <GameLookIconMark look={look} />
    </button>
  ) : (
    <GameLookIconMark look={look} />
  );
  const mainClass = cn("play-game", gameLookClass(look));

  return (
    <div className={cn("wizard-preview game-phone", edit && "is-editing", lookEdit && "has-look-edit")}>
      <div className="wizard-preview__views" role="tablist" aria-label="プレビューする画面">
        {VIEWS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={view === item.id}
            onClick={() => {
              selectLook(null);
              setView(item.id);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      {edit && view !== "clear" ? (
        <p className="wizard-preview__edit-hint">文字はタップして、そのまま書き換えられます</p>
      ) : lookEdit ? (
        <p className="wizard-preview__edit-hint">
          {view === "start"
            ? "アイコンや背景はタップして変えられます"
            : view === "clear"
              ? "「おめでとう！」「クリア！」の言葉や色、真ん中の絵もタップで変えられます"
              : "部品はタップで選び、押したままドラッグで動かせます"}
        </p>
      ) : null}
      <div className="wizard-preview__zoom">
        <span>{actual ? "実寸（100%）" : `実寸の${Math.round(scale * 100)}%`}</span>
        <button type="button" onClick={() => setActual((current) => !current)}>
          {actual ? "画面に合わせる" : "実寸で見る"}
        </button>
      </div>
      <div ref={stageRef} className={cn("wizard-preview__stage", actual && "is-actual")}>
        <div className="wizard-preview__fit" style={{ width: PHONE_W * scale, height: PHONE_H * scale }}>
          {lookEdit ? (
            <div className="wizard-preview__adds">
              <button type="button" className="wizard-preview__add" data-fab="icon" onClick={() => selectLook("icon", "icon")}>
                <Award aria-hidden />
                アイコン
              </button>
              <button
                type="button"
                className="wizard-preview__add"
                data-fab="insert"
                disabled={look.shapes.length >= START_SHAPE_MAX && look.images.length >= START_IMAGE_MAX}
                onClick={() => {
                  selectLook(null);
                  setInserting(look.shapes.length >= START_SHAPE_MAX ? "image" : "shape");
                }}
              >
                <Plus aria-hidden />
                挿入
              </button>
              <button type="button" className="wizard-preview__add" data-fab="background" onClick={() => selectLook("background")}>
                <Palette aria-hidden />
                背景
              </button>
            </div>
          ) : null}
          <div
            className="wizard-preview__phone"
            style={{ width: PHONE_W, height: PHONE_H, padding: BEZEL, transform: `scale(${scale})` }}
          >
            <div className="wizard-preview__screen" style={{ ["--preview-scale" as string]: String(scale) }}>
              <div
                className="play-game-shell"
                onClick={(event) => {
                  // 何もないところ（背景・カードの余白）をタップしたら、背景を選ぶ。
                  const target = event.target as HTMLElement;
                  if (
                    lookEdit &&
                    target.matches(".play-look-bg, .play-game, .play-game__card, .play-look-head, .play-look-head > .rally-move")
                  ) {
                    selectLook("background");
                  }
                }}
              >
                <PlayLocaleSwitch />
                {view === "play" && edit?.quiz ? (
                  <main className={cn(mainClass, "play-game--scene")}>
                    <GameLookBackdrop look={look} />
                    {built ? <GameSceneBand look={look} scene="play" progress={gamePlayProgress(built.progress)} /> : null}
                    <div className="play-game__card">
                      <PlayLookHead
                        look={look}
                        screen="play"
                        edit={headerEdit}
                        kicker={<p className="play-game__kicker">{copy.msg(typeLabel)}</p>}
                        title={<h1>{title}</h1>}
                        meta={<p className="play-game__meta">プレビュー</p>}
                      />
                      <QuizPreviewEditor edit={edit.quiz} />
                    </div>
                  </main>
                ) : view === "start" || !built ? (
                  <main className={cn(mainClass, "play-game--scene")}>
                    <GameLookBackdrop look={look} />
                    <GameSceneBand look={look} scene="start" />
                    <div className="play-game__card">
                      <GameStartHeader
                        look={lookForScreen(look, "start")}
                        edit={headerEdit}
                        parts={{
                          icon,
                          kicker: <p className="play-game__kicker">{typeLabel}</p>,
                          title: edit ? (
                            <h1>
                              <textarea
                                className="quiz-edit__text quiz-edit__title"
                                value={name}
                                placeholder={typeLabel}
                                aria-label="ゲーム名"
                                maxLength={80}
                                rows={1}
                                onChange={(event) => edit.onName(event.target.value)}
                              />
                            </h1>
                          ) : (
                            <h1>{title}</h1>
                          ),
                          desc: edit ? (
                            <p className="play-game__desc">
                              <textarea
                                className="quiz-edit__text"
                                value={description}
                                placeholder="説明文を入力"
                                aria-label="説明文"
                                maxLength={200}
                                rows={2}
                                onChange={(event) => edit.onDescription(event.target.value)}
                              />
                            </p>
                          ) : description.trim() ? (
                            <p className="play-game__desc">{description.trim()}</p>
                          ) : null,
                          meta: <p className="play-game__meta">{built ? built.meta : copy.spotsPreparing}</p>,
                        }}
                        renderForm={({ fields, dock }) => (
                          // プレビューでは参加しないので、本物の入力欄は置かない（パスワードの候補などが出ないように）。
                          <div className="play-join">
                            {fields(
                              <>
                                <p className="play-join__lead">{copy.joinWithWords}</p>
                                <div style={FAKE_FIELD}>
                                  {copy.nickname}
                                  <span style={FAKE_BOX} aria-hidden />
                                </div>
                                <div style={FAKE_FIELD}>
                                  {copy.passphrase}
                                  <span style={{ position: "relative", display: "block" }}>
                                    <span style={FAKE_BOX} aria-hidden />
                                    <span style={FAKE_SHOW} aria-hidden>
                                      {copy.showSecret}
                                    </span>
                                  </span>
                                </div>
                              </>,
                            )}
                            <div className={dock.className} style={dock.style} onPointerDown={dock.onPointerDown}>
                              {/* 編集中は、ボタンを押したままドラッグで動かせる。 */}
                              <button
                                type="button"
                                className="play-dock__go is-editable"
                                onClick={() => lookEdit && selectLook("text", "button")}
                              >
                                {copy.join}
                              </button>
                            </div>
                          </div>
                        )}
                      />
                    </div>
                  </main>
                ) : (
                  <main className={cn(mainClass, "play-game--scene")}>
                    <GameLookBackdrop look={look} />
                    {view === "clear" ? (
                      <GameSceneBand
                        look={look}
                        scene="clear"
                        edit={
                          lookEdit
                            ? {
                                selected: activeMove,
                                onSelect: (key) => selectLook(key === "trophy" ? "clearIcon" : "text", key),
                                onWords: (key, value) =>
                                  update((current) => ({
                                    ...current,
                                    clearWords: { ...(current.clearWords ?? { congrats: "", title: "" }), [key]: value },
                                  })),
                              }
                            : undefined
                        }
                      />
                    ) : (
                      <GameSceneBand look={look} scene="play" progress={gamePlayProgress(built.progress)} />
                    )}
                    <div className="play-game__card">
                      <PlayLookHead
                        look={look}
                        screen={view === "clear" ? "clear" : "play"}
                        edit={headerEdit}
                        kicker={<p className="play-game__kicker">{copy.msg(typeLabel)}</p>}
                        title={<h1>{title}</h1>}
                        meta={<p className="play-game__meta">{built.progress.nickname}</p>}
                      />
                      <ClearLayer
                        look={look}
                        enabled
                        screen={view === "clear" ? "clear" : "play"}
                        edit={
                          lookEdit
                            ? { active: activeMove, onSelect: (key) => selectLook(null, key), onMove: setOffset }
                            : undefined
                        }
                      >
                        {built.screen(built.progress)}
                      </ClearLayer>
                    </div>
                  </main>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {lookEdit && lookSel && !pickingIcon ? (
        <FloatingPanel
          anchorKey={lookSel === "background" ? "background" : (activeMove ?? "")}
          getAnchor={lookSel === "background" ? () => getFabAnchor("background") : getMoveAnchor}
        >
          <GameLookEditPanel
            selection={lookSel}
            look={look}
            onLook={lookEdit.onChange}
            textKey={
              lookSel === "text" && (GAME_LOOK_TEXT_KEYS as readonly string[]).includes(activeMove ?? "")
                ? (activeMove as GameLookTextKey)
                : null
            }
            partLabel={activeMove === "form" ? "入力欄" : activeMove === "button" ? "参加ボタン" : undefined}
            moved={activeMove ? Boolean(look.offsets[activeMove]) : false}
            onResetPosition={() => activeMove && setOffset(activeMove, null)}
            onPickImage={() => setPickingIcon(true)}
            bgImageField={lookEdit.bgImageField}
            onClose={() => selectLook(null)}
          />
          </FloatingPanel>
      ) : null}
      {lookEdit && selectedShape && !inserting ? (
        <div className="wizard-preview__toolbar" data-place={panelPlace}>
          <ShapeEditPanel
            key={selectedShape.id}
            shape={selectedShape}
            onChange={(patch) => patchShape(selectedShape.id, patch)}
            onDelete={() => {
              const key = `shape:${selectedShape.id}`;
              update((current) => {
                const offsets = { ...current.offsets };
                delete offsets[key];
                return { ...current, offsets, shapes: current.shapes.filter((item) => item.id !== selectedShape.id) };
              });
              selectLook(null);
            }}
            onClose={() => selectLook(null)}
          />
        </div>
      ) : null}
      {lookEdit && inserting ? (
        <FloatingPanel anchorKey="insert" getAnchor={() => getFabAnchor("insert")}>
          <div className="look-insert" style={{ padding: "0 0.5rem 0.5rem" }}>
          <div className="look-insert__tabs" role="tablist" aria-label="挿入するもの">
            {(
              [
                ["shape", "図形", Shapes],
                ["image", "画像", ImagePlus],
                ["video", "動画", Video],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={inserting === id}
                className={cn(inserting === id && "is-on")}
                onClick={() => setInserting(id)}
              >
                <Icon aria-hidden />
                {label}
              </button>
            ))}
            <button type="button" onClick={addText} disabled={look.extraTexts.length >= START_TEXT_MAX}>
              <Type aria-hidden />
              テキスト
            </button>
          </div>
          {inserting === "shape" ? (
            <ShapePicker onPick={addShape} onClose={() => setInserting(null)} />
          ) : inserting === "video" ? (
            <div className="edit-panel" style={{ display: "grid", gap: "0.4rem" }}>
              {lookEdit.videoField(addVideo)}
              <p className="edit-panel__note edit-panel__note--show">
                {look.images.filter((item) => item.video).length >= START_VIDEO_MAX
                  ? `動画は${START_VIDEO_MAX}つまで入れられます`
                  : "MP4・WEBM・MOV、20MBまで。入れると、くり返し再生されます"}
              </p>
            </div>
          ) : (
            <StartImagePicker
              onPick={addImage}
              onClose={() => setInserting(null)}
              uploadField={lookEdit.uploadField(addImage)}
            />
          )}
          </div>
        </FloatingPanel>
      ) : null}
      {lookEdit && activeMove && /^p?blk:/.test(activeMove) && !inserting ? (
        <FloatingPanel anchorKey={activeMove} getAnchor={getMoveAnchor}>
          <GameLookBlockPanel
            style={look.blocks?.[activeMove] ?? { ...FINE_DEFAULT, color: "", bg: "" }}
            moved={Boolean(look.offsets[activeMove])}
            onChange={(patch) =>
              update((current) => {
                const blocks = { ...(current.blocks ?? {}) };
                const base: GameLookTextStyle = blocks[activeMove] ?? { ...FINE_DEFAULT, color: "", bg: "" };
                const next: GameLookTextStyle = { ...base, ...patch };
                if (next.color || next.bg || !fineIsDefault(next)) blocks[activeMove] = next;
                else delete blocks[activeMove];
                return { ...current, blocks };
              })
            }
            onResetPosition={() => setOffset(activeMove, null)}
            onClose={() => selectLook(null)}
          />
        </FloatingPanel>
      ) : null}
      {lookEdit && selectedText && !inserting ? (
        <FloatingPanel anchorKey={`extra:${selectedText.id}`} getAnchor={getMoveAnchor}>
          <GameLookTextPanel
            key={selectedText.id}
            item={selectedText}
            onChange={(patch) => patchText(selectedText.id, patch)}
            onDelete={() => deleteAdded(`extra:${selectedText.id}`)}
            onClose={() => selectLook(null)}
          />
        </FloatingPanel>
      ) : null}
      {lookEdit && selectedImage && !inserting ? (
        <div className="wizard-preview__toolbar" data-place={panelPlace}>
          <GameLookImagePanel
            key={selectedImage.id}
            image={selectedImage}
            onChange={(patch) => patchImage(selectedImage.id, patch)}
            onDelete={() => {
              const key = `img:${selectedImage.id}`;
              update((current) => {
                const offsets = { ...current.offsets };
                delete offsets[key];
                return { ...current, offsets, images: current.images.filter((item) => item.id !== selectedImage.id) };
              });
              selectLook(null);
            }}
            onClose={() => selectLook(null)}
          />
        </div>
      ) : null}
      {lookEdit && pickingIcon ? (
        <div className="wizard-preview__toolbar" data-place="bottom">
          <StartImagePicker
            onPick={(url) => {
              lookEdit.onChange({ ...look, iconImageUrl: url });
              setPickingIcon(false);
            }}
            onClose={() => setPickingIcon(false)}
            uploadField={lookEdit.uploadField((url) => {
              lookEdit.onChange({ ...look, iconImageUrl: url });
              setPickingIcon(false);
            })}
          />
        </div>
      ) : null}
      {!built && !edit?.quiz ? <p className="wizard-preview__note">内容を入れると、プレイ中とクリアの画面も見られます。</p> : null}
    </div>
  );
}
