"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { ArrowRight, Gift, Stamp, Trophy } from "lucide-react";
import { PlayClearPanel } from "@/components/play/PlayMoment";
import { PlayExitLink } from "@/components/play/PlayLocaleSwitch";
import { usePlayCopy } from "@/components/play/usePlayCopy";
import { GrowText } from "@/components/play/rally/RallyStartScreen";
import { useMoveLayer } from "@/components/play/rally/useMoveLayer";
import type { RallyStampEvent } from "@/components/play/rally/types";
import {
  GAME_REWARD_KIND_LABEL,
  LAYOUT_KEEP_KEYS,
  createScreenLayout,
  type GameScreenLayout,
  type PublicPlayMoment,
  type StartOffset,
} from "@/lib/organizer/game-experience";
import type { PlayProgress } from "@/lib/organizer/play-types";
import { playStampSound } from "@/lib/organizer/play-stamp-sound";

/** 主催者のプレビューで、スタンプGETとクリアの画面を直接編集する。 */
export type RallyMomentField = "stampMessage" | "clearTitle" | "clearMessage" | "rewardLabel";
/**
 * 選んでいるもの。seal はスタンプ、trophy はトロフィー、rewardBox は特典の札。
 * ribbon・name・msg・card は動かせる部品、extra:<id> と img:<id> は足したもの。
 */
export type RallyMomentSelection =
  | "seal"
  | "ribbon"
  | "name"
  | "msg"
  | "card"
  | "trophy"
  | "rewardBox"
  | "congrats"
  | "lead"
  | "title"
  | "meter"
  | "bookTitle"
  | "book"
  | "nextTitle"
  | "next"
  | `spotSeal:${string}`
  | "background"
  | `extra:${string}`
  | `img:${string}`
  | `shape:${string}`;
export type RallyMomentScreen = "stamp" | "clear" | "home";
export type RallyMomentEdit = {
  onChange: (field: RallyMomentField, value: string) => void;
  selected: RallyMomentSelection | null;
  onSelect: (selection: RallyMomentSelection | null) => void;
  /** 配置・足したテキストや画像・背景を変える。 */
  onLayout: (screen: RallyMomentScreen, layout: GameScreenLayout) => void;
  /** バッジの絵（特典がバッジのとき、トロフィーの代わりに出す）。 */
  rewardImageUrl?: string;
};

/** 選んだものが、ドラッグで動かす部品ならそのキー。 */
export function moveKeyOf(selected: RallyMomentSelection | null): string | null {
  if (!selected || selected === "background") return null;
  if (selected === "rewardBox") return "card";
  if (selected.startsWith("spotSeal:")) return "book";
  return selected;
}

/** 配置を変える関数をまとめる（スタンプGETとクリアで共通）。 */
export function layoutActions(screen: RallyMomentScreen, layout: GameScreenLayout, edit: RallyMomentEdit) {
  const save = (next: Partial<GameScreenLayout>) => edit.onLayout(screen, { ...layout, ...next });
  return {
    onMove: (key: string, offset: StartOffset | null) => {
      const offsets = { ...layout.offsets };
      if (offset) offsets[key] = offset;
      else delete offsets[key];
      save({ offsets });
    },
    onResize: (key: string, width: number) => {
      const id = key.slice(key.indexOf(":") + 1);
      if (key.startsWith("img:")) save({ images: layout.images.map((item) => (item.id === id ? { ...item, width } : item)) });
      else save({ shapes: layout.shapes.map((item) => (item.id === id ? { ...item, width } : item)) });
    },
    onShapeLabel: (id: string, label: string) =>
      save({ shapes: layout.shapes.map((item) => (item.id === id ? { ...item, label } : item)) }),
    onDelete: (key: string) => {
      const offsets = { ...layout.offsets };
      delete offsets[key];
      if (key.startsWith("img:")) {
        save({ offsets, images: layout.images.filter((item) => `img:${item.id}` !== key) });
      } else if (key.startsWith("extra:")) {
        save({ offsets, texts: layout.texts.filter((item) => `extra:${item.id}` !== key) });
      } else if (key.startsWith("shape:")) {
        save({ offsets, shapes: layout.shapes.filter((item) => `shape:${item.id}` !== key) });
      } else {
        // もとからある部品は、消さずに隠す（背景の設定から戻せる）。
        save({ offsets, hidden: [...new Set([...layout.hidden, key])] });
      }
      edit.onSelect(null);
    },
    canDelete: (key: string) => !(LAYOUT_KEEP_KEYS as readonly string[]).includes(key),
    onSelectKey: (key: string) => edit.onSelect(key as RallyMomentSelection),
    onTextChange: (id: string, text: string) =>
      save({ texts: layout.texts.map((item) => (item.id === id ? { ...item, text } : item)) }),
  };
}

/** 足したテキスト（編集中は入力欄）と画像。 */
export function Extras({
  layout,
  layer,
  edit,
  actions,
}: {
  layout: GameScreenLayout;
  layer: ReturnType<typeof useMoveLayer>;
  edit?: RallyMomentEdit;
  actions?: ReturnType<typeof layoutActions>;
}) {
  return (
    <>
      {layout.texts.map((item) =>
        edit && actions
          ? layer.movable(
              `extra:${item.id}`,
              <GrowText
                className={`rally-start__extra rally-start__extra--${item.size}${item.bold ? " is-bold" : ""}${
                  edit.selected === `extra:${item.id}` ? " is-selected" : ""
                }`}
                value={item.text}
                placeholder="テキストを入力"
                maxLength={120}
                label="追加したテキスト"
                color={item.color}
                onFocus={() => edit.onSelect(`extra:${item.id}`)}
                onChange={(value) => actions.onTextChange(item.id, value)}
              />,
            )
          : layer.textView(item),
      )}
      {layout.images.map((item) => layer.imageNode(item, edit?.selected === `img:${item.id}`))}
      {(layout.shapes ?? []).map((item) => layer.shapeNode(item, edit?.selected === `shape:${item.id}`))}
    </>
  );
}

/** 部品の上を押したか（部品の入れ物の余白は、背景として扱う）。 */
export function isPart(target: HTMLElement): boolean {
  const box = target.closest(".rally-move");
  return Boolean(box && box !== target);
}

/** カードの色を CSS の変数にする（空ならもとの色）。 */
export function cardStyle(layout: GameScreenLayout): CSSProperties | undefined {
  const card = layout.card;
  if (!card) return undefined;
  const style: Record<string, string> = {};
  if (card.bg) style["--card-bg"] = card.bg;
  if (card.number) style["--card-number"] = card.number;
  if (card.text) style["--card-text"] = card.text;
  if (card.accent) style["--card-accent"] = card.accent;
  return Object.keys(style).length > 0 ? (style as CSSProperties) : undefined;
}

export function shadeClass(layout: GameScreenLayout) {
  return [
    `rally-layer--shade-${layout.shade}`,
    layout.bgTheme ? `rally-bg--${layout.bgTheme}` : "",
    layout.rays === false ? "rally-layer--no-rays" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/** 選んだ部品に、タップで選べるようにする。 */
export function selectable(edit: RallyMomentEdit | undefined, selection: RallyMomentSelection) {
  if (!edit) return {};
  return {
    onClick: (event: { stopPropagation: () => void; target: EventTarget }) => {
      event.stopPropagation();
      // 中の入力欄を押したときは、その入力欄の選択（onFocus）を優先する。
      if ((event.target as HTMLElement).closest("textarea, input")) return;
      edit.onSelect(selection);
    },
  };
}

/** スタンプを押した直後の画面。 */
export function RallyStampGetScreen({
  event,
  progress,
  moment,
  heroImageUrl,
  onBook,
  onNext,
  onReward,
  edit,
}: {
  edit?: RallyMomentEdit;
  event: RallyStampEvent;
  progress: PlayProgress;
  moment: PublicPlayMoment | null;
  heroImageUrl: string;
  onBook: () => void;
  onNext: () => void;
  onReward: () => void;
}) {
  const copy = usePlayCopy();
  const rootRef = useRef<HTMLDivElement>(null);
  const layout = moment?.stampLayout ?? createScreenLayout();
  const actions = edit ? layoutActions("stamp", layout, edit) : undefined;
  const layer = useMoveLayer({
    containerRef: rootRef,
    offsets: layout.offsets,
    activeKey: moveKeyOf(edit?.selected ?? null),
    edit: actions,
  });

  useEffect(() => {
    if (edit) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onBook();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [edit, onBook]);

  const spot = event.spotId ? progress.spots.find((item) => item.id === event.spotId) : undefined;
  const sound = moment?.stampSound;
  const soundUrl = moment?.stampSoundUrl;
  useEffect(() => {
    if (event.already) return;
    if (!soundUrl && (!sound || sound === "none")) return;
    playStampSound(sound ?? "none", soundUrl);
  }, [event.already, sound, soundUrl]);

  const face = spot?.stampImageUrl || spot?.imageUrl || moment?.stampImageUrl || progress.stampImageUrl || "";
  const total = progress.spotCount;
  const done = progress.stampedCount;
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  const left = Math.max(0, total - done);
  const animation = event.already ? "none" : (moment?.stampAnimation ?? "pop");
  const bg = layout.bgImageUrl || heroImageUrl;
  const shown = (key: string) => !layout.hidden.includes(key);

  return (
    <div
      ref={rootRef}
      className={[
        "rally-get rally-layer",
        shadeClass(layout),
        edit ? "is-editing" : "",
        edit?.selected === "background" ? "is-bg-selected" : "",
        layer.dragging ? "is-dragging" : "",
        layer.guide ? "is-guide" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ ["--layer-text" as string]: layout.textColor }}
      role="dialog"
      aria-modal="true"
      aria-label={copy.rally.stampGet}
      onClick={
        edit
          ? (ev) => {
              if (layer.justGestured()) return;
              const target = ev.target as HTMLElement;
              if (target.closest("textarea, input, button") || isPart(target)) return;
              edit.onSelect("background");
            }
          : undefined
      }
    >
      {layout.bgVideoUrl ? (
        <video
          className="rally-get__bg"
          src={layout.bgVideoUrl}
          poster={bg || undefined}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        />
      ) : bg ? (
        <img className="rally-get__bg" src={bg} alt="" aria-hidden />
      ) : null}
      <div className="rally-burst" aria-hidden />
      {animation === "confetti" || animation === "sparkle" ? (
        <div className={`rally-confetti rally-confetti--${animation}`} aria-hidden>
          {Array.from({ length: 18 }, (_, i) => (
            <span key={i} style={{ ["--i" as string]: i }} />
          ))}
        </div>
      ) : null}
      <div className="rally-get__inner">
        {shown("ribbon")
          ? layer.movable(
              "ribbon",
              <p className={`rally-ribbon${edit ? " is-editable" : ""}`} {...selectable(edit, "ribbon")}>
                {event.already ? copy.rally.alreadyGot : copy.rally.stampGet}
              </p>,
            )
          : null}
        {shown("seal") &&
          layer.movable(
            "seal",
            <div
              className={[
                `rally-get__seal rally-get__seal--${animation}`,
                edit ? "is-editable" : "",
                edit?.selected === "seal" ? "is-selected" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              {...selectable(edit, "seal")}
              role={edit ? "button" : undefined}
              aria-label={edit ? "スタンプの絵と演出を変える" : undefined}
            >
              {face ? <img src={face} alt="" draggable={false} /> : <Stamp aria-hidden />}
              {edit && edit.selected !== "seal" ? <span className="rally-edit-badge">タップで変更</span> : null}
            </div>,
          )}
        {shown("name")
          ? layer.movable(
              "name",
              <p className={`rally-get__name${edit ? " is-editable" : ""}`} {...selectable(edit, "name")}>
                {event.name}
              </p>,
            )
          : null}
        {!shown("msg")
          ? null
          : edit
            ? layer.movable(
                "msg",
                <GrowText
                  className={`rally-get__msg${edit.selected === "msg" ? " is-selected" : ""}`}
                  value={moment?.stampMessage ?? ""}
                  placeholder="ひとことメッセージ（例：やったね！）"
                  maxLength={40}
                  label="スタンプを押したときのメッセージ"
                  onFocus={() => edit.onSelect("msg")}
                  onChange={(value) => edit.onChange("stampMessage", value)}
                />,
              )
            : moment?.stampMessage && !event.already
              ? layer.movable("msg", <p className="rally-get__msg">{moment.stampMessage}</p>)
              : null}
        <Extras layout={layout} layer={layer} edit={edit} actions={actions} />
        {layer.movable(
          "card",
          <div
            className={`rally-get__card rally-card-colors${edit ? " is-editable" : ""}`}
            style={cardStyle(layout)}
            {...selectable(edit, "card")}
          >
            <p className="rally-get__count">
              <strong>{done}</strong> / {total}
            </p>
            <div className="rally-meter__bar">
              <span style={{ width: `${pct}%` }} />
            </div>
            <p className="rally-meter__left">{progress.completed ? copy.rally.allDone : copy.rallyLeft(left)}</p>
            {progress.completed ? (
              <button type="button" className="rally-cta" onClick={onReward}>
                <Gift aria-hidden />
                {copy.rally.toReward}
              </button>
            ) : (
              <button type="button" className="rally-cta" onClick={onNext}>
                {copy.rally.nextSpot}
                <ArrowRight aria-hidden />
              </button>
            )}
            <button type="button" className="rally-ghost" onClick={onBook}>
              {copy.rally.seeBook}
            </button>
          </div>,
        )}
      </div>
    </div>
  );
}

export function hasReward(progress: PlayProgress, moment: PublicPlayMoment | null): boolean {
  return Boolean(
    moment?.rewardLabel ||
    moment?.clearTitle ||
    moment?.clearMessage ||
    progress.rewardCode ||
    progress.rewardUsed ||
    progress.rewardPoints ||
    progress.rewardBadge,
  );
}

/** すべて集めたあとの特典（クリア）画面。edit があれば、その場で編集できる。 */
export function RallyClearScreen({
  title,
  heroImageUrl,
  progress,
  moment,
  claimHref,
  edit,
}: {
  title: string;
  heroImageUrl: string;
  progress: PlayProgress;
  moment: PublicPlayMoment;
  claimHref: string;
  edit?: RallyMomentEdit;
}) {
  const copy = usePlayCopy();
  const rootRef = useRef<HTMLElement>(null);
  const layout = moment.clearLayout ?? createScreenLayout();
  const actions = edit ? layoutActions("clear", layout, edit) : undefined;
  const layer = useMoveLayer({
    containerRef: rootRef,
    offsets: layout.offsets,
    activeKey: moveKeyOf(edit?.selected ?? null),
    edit: actions,
  });
  const bg = layout.bgImageUrl || heroImageUrl;
  const kindLabel = moment.rewardKind === "name" ? "特典" : GAME_REWARD_KIND_LABEL[moment.rewardKind];
  const shown = (key: string) => !layout.hidden.includes(key);

  let rewardBody: ReactNode = null;
  if (edit) {
    rewardBody = (
      <>
        {shown("msg")
          ? layer.movable(
              "msg",
              <GrowText
                className={`rally-clear__msg${edit.selected === "msg" ? " is-selected" : ""}`}
                value={moment.clearMessage}
                placeholder="クリアした人へのメッセージ（例：受付で画面を見せてください）"
                maxLength={120}
                label="クリアのメッセージ"
                onFocus={() => edit.onSelect("msg")}
                onChange={(value) => edit.onChange("clearMessage", value)}
              />,
            )
          : null}
        <div
          className={`rally-clear__reward-edit${edit.selected === "rewardBox" ? " is-selected" : ""}`}
          {...selectable(edit, "rewardBox")}
        >
          <span>{kindLabel}：</span>
          <input
            className="rally-edit"
            value={moment.rewardLabel}
            placeholder="特典の名前（例：ドリンク1杯無料）"
            maxLength={40}
            aria-label="特典の名前"
            onFocus={() => edit.onSelect("rewardBox")}
            onChange={(ev) => edit.onChange("rewardLabel", ev.target.value)}
          />
        </div>
      </>
    );
  } else if (hasReward(progress, moment)) {
    rewardBody = (
      <PlayClearPanel
        moment={{
          ...moment,
          clearTitle: "",
          clearMessage: shown("msg") ? moment.clearMessage : "",
          showCharacter: false,
        }}
        code={progress.rewardCode}
        used={progress.rewardUsed}
        points={progress.rewardPoints}
        pointsAwarded={progress.rewardPointsAwarded}
        badge={progress.rewardBadge}
        badgeAwarded={progress.rewardBadgeAwarded}
        badgeImage={progress.rewardBadgeImage}
        claimHref={claimHref}
      />
    );
  }

  return (
    <main
      ref={rootRef}
      className={[
        "rally-clear rally-layer",
        shadeClass(layout),
        edit ? "is-editing" : "",
        edit?.selected === "background" ? "is-bg-selected" : "",
        layer.dragging ? "is-dragging" : "",
        layer.guide ? "is-guide" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={
        edit
          ? (ev) => {
              if (layer.justGestured()) return;
              const target = ev.target as HTMLElement;
              if (target.closest("textarea, input, button, a") || isPart(target)) return;
              edit.onSelect("background");
            }
          : undefined
      }
    >
      {layout.bgVideoUrl ? (
        <video
          className="rally-layer__bg"
          src={layout.bgVideoUrl}
          poster={bg || undefined}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        />
      ) : bg ? (
        <img className="rally-layer__bg" src={bg} alt="" aria-hidden />
      ) : null}
      <div className="rally-clear__hero">
        <PlayExitLink className="rally-clear__exit" />
        <div className="rally-burst" aria-hidden />
        {shown("congrats")
          ? layer.movable(
              "congrats",
              <p
                className={`rally-ribbon rally-ribbon--small${edit ? " is-editable" : ""}`}
                {...selectable(edit, "congrats")}
              >
                {copy.rally.congrats}
              </p>,
            )
          : null}
        {shown("ribbon") &&
          layer.movable(
            "ribbon",
            edit ? (
              <div className={`rally-ribbon rally-ribbon--edit${edit.selected === "ribbon" ? " is-selected" : ""}`}>
                <input
                  className="rally-edit"
                  value={moment.clearTitle}
                  placeholder={copy.rally.complete}
                  maxLength={40}
                  aria-label="クリアのタイトル"
                  onFocus={() => edit.onSelect("ribbon")}
                  onChange={(ev) => edit.onChange("clearTitle", ev.target.value)}
                />
              </div>
            ) : (
              <p className="rally-ribbon">{moment.clearTitle ? copy.msg(moment.clearTitle) : copy.rally.complete}</p>
            ),
          )}
        {shown("trophy") &&
          layer.movable(
            "trophy",
            <button
              type="button"
              className={`rally-clear__trophy${edit ? " is-editable" : ""}${edit?.selected === "trophy" ? " is-selected" : ""}`}
              {...selectable(edit, "trophy")}
              aria-label={edit ? "特典の種類を変える" : undefined}
              aria-hidden={edit ? undefined : true}
              tabIndex={edit ? 0 : -1}
            >
              {moment.rewardKind === "badge" && (edit?.rewardImageUrl || progress.rewardBadgeImage) ? (
                <img src={edit?.rewardImageUrl || progress.rewardBadgeImage} alt="" draggable={false} />
              ) : (
                <Trophy aria-hidden />
              )}
              {edit && edit.selected !== "trophy" ? <span className="rally-edit-badge">タップで変更</span> : null}
            </button>,
          )}
        <Extras layout={layout} layer={layer} edit={edit} actions={actions} />
      </div>
      {layer.movable(
        "card",
        <div
          className={`rally-clear__card rally-card-colors${edit ? " is-editable" : ""}`}
          style={cardStyle(layout)}
          {...selectable(edit, "card")}
        >
          {shown("lead")
            ? layer.movable(
                "lead",
                <p className={`rally-clear__lead${edit ? " is-editable" : ""}`} {...selectable(edit, "lead")}>
                  {copy.rally.allDone}
                </p>,
              )
            : null}
          {shown("title")
            ? layer.movable(
                "title",
                <p className={`rally-clear__title${edit ? " is-editable" : ""}`} {...selectable(edit, "title")}>
                  {title}
                </p>,
              )
            : null}
          {rewardBody}
        </div>,
      )}
    </main>
  );
}
