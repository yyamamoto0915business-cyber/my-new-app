"use client";

import {
  useLayoutEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import {
  BookOpen,
  Camera,
  CircleHelp,
  Flag,
  Gift,
  MapPin,
  Sparkles,
  Stamp,
  Star,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { useMoveLayer } from "@/components/play/rally/useMoveLayer";
import { BG_THEME_SWATCH, type StartOffset } from "@/lib/organizer/game-experience";
import {
  DEFAULT_GAME_LOOK,
  fineIsDefault,
  fineStyle,
  gameLookHasBg,
  lookForScreen,
  type GameLookScreen,
  type GameLook,
  type GameLookIcon,
  type GameLookMoveKey,
} from "@/lib/organizer/game-look";
import { cn } from "@/lib/utils";
import "@/components/play/rally/rally.css";

export const GAME_LOOK_ICON_COMPONENT: Record<GameLookIcon, LucideIcon> = {
  stamp: Stamp,
  quiz: CircleHelp,
  trophy: Trophy,
  flag: Flag,
  map: MapPin,
  star: Star,
  camera: Camera,
  gift: Gift,
  book: BookOpen,
  sparkles: Sparkles,
};

/** 参加画面の上のアイコン。画像を選んでいれば画像を出す。 */
export function GameLookIconMark({ look }: { look?: GameLook | null }) {
  const value = look ?? DEFAULT_GAME_LOOK;
  if (value.iconImageUrl) {
    return (
      <span className="play-game__icon play-game__icon--image" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element -- 主催者が入れた画像（外部URLもある） */}
        <img src={value.iconImageUrl} alt="" />
      </span>
    );
  }
  const Icon = GAME_LOOK_ICON_COMPONENT[value.icon];
  return (
    <span className="play-game__icon" aria-hidden>
      <Icon className="h-7 w-7" strokeWidth={1.6} />
    </span>
  );
}

/** 背景を変えているときに main に付ける class。 */
export function gameLookClass(look: GameLook | null | undefined): string {
  return gameLookHasBg(look) ? "play-game--look" : "";
}

/** 画面いっぱいの背景。色のテーマか写真。変えていなければ何も出さない。 */
export function GameLookBackdrop({ look }: { look: GameLook | null | undefined }) {
  if (!look || !gameLookHasBg(look)) return null;
  const style = look.bgImageUrl
    ? { backgroundImage: `url("${look.bgImageUrl.replace(/"/g, "%22")}")` }
    : look.bgTheme
      ? { background: BG_THEME_SWATCH[look.bgTheme] }
      : undefined;
  return (
    <div
      className={cn("play-look-bg", look.bgImageUrl && `play-look-bg--shade-${look.shade}`)}
      style={style}
      aria-hidden
    />
  );
}

export type GameStartHeaderEdit = {
  /** いま選んでいる部品（つまみを出す）。足した図形は shape:<id>。 */
  active: string | null;
  onMove: (key: string, offset: StartOffset | null) => void;
  onSelect: (key: string) => void;
  /** 図形の幅（%）を変える。 */
  onResize: (key: string, width: number) => void;
  /** ボタンの文字を書き換える。 */
  onShapeLabel: (id: string, label: string) => void;
  /** 足したテキストの中身を書き換える。 */
  onExtraText: (id: string, text: string) => void;
  /** 足した図形・画像・テキストを消す。 */
  onDelete: (key: string) => void;
};

/**
 * 参加画面の上の部分（アイコン・種類・タイトル・説明・問題数など）と、主催者が足した図形。
 * 主催者がドラッグで動かした位置・選んだ色で並べる。edit があれば、押したままドラッグで動かせる。
 */
/** 参加の入力欄と参加ボタンを、動かせるようにして並べるためのもの。 */
export type GameStartFormSlots = {
  /** ニックネーム・合言葉などの入力欄をまとめて包む。 */
  fields: (children: ReactNode) => ReactNode;
  /** 参加ボタンの帯（.play-dock）に付けるもの。画面の下に固定したまま、ずらして見せる。 */
  dock: {
    className: string;
    style: CSSProperties | undefined;
    onPointerDown: ((event: ReactPointerEvent) => void) | undefined;
  };
};

export function GameStartHeader({
  look,
  parts,
  edit,
  renderForm,
}: {
  look: GameLook | null | undefined;
  /** 部品ごとの中身。null の部品は出さない。 */
  parts: Record<GameLookMoveKey, ReactNode>;
  edit?: GameStartHeaderEdit;
  /** 参加フォーム。入力欄と参加ボタンを動かせる。 */
  renderForm?: (slots: GameStartFormSlots) => ReactNode;
}) {
  const value = look ?? DEFAULT_GAME_LOOK;
  // 足したテキストの項目がない古い保存データでも、落ちないように。
  const extraTexts = value.extraTexts ?? [];
  // 位置の基準は、まわりのカード（画面の幅・高さに近い）。
  const headRef = useRef<HTMLDivElement>(null);
  const containerRef = useMemo<RefObject<HTMLElement | null>>(
    () => ({
      get current() {
        return headRef.current?.closest<HTMLElement>(".play-game__card") ?? headRef.current;
      },
    }),
    [],
  );
  const { movable, shapeNode, imageNode, dragging, guide, moveStyle, pressDrag } = useMoveLayer({
    containerRef,
    offsets: value.offsets,
    activeKey: edit?.active ?? null,
    edit: edit
      ? {
          onMove: edit.onMove,
          onResize: edit.onResize,
          onShapeLabel: edit.onShapeLabel,
          onDelete: edit.onDelete,
          canDelete: (key) => key.startsWith("shape:") || key.startsWith("img:") || key.startsWith("extra:"),
          onSelectKey: edit.onSelect,
        }
      : undefined,
  });
  const order: GameLookMoveKey[] = ["icon", "kicker", "title", "desc", "meta"];
  const dockStyle = moveStyle("button");
  const slots: GameStartFormSlots = {
    fields: (children) =>
      value.offsets.form || edit ? movable("form", <div className="play-join__fields">{children}</div>) : children,
    dock: {
      className: cn(
        "play-dock",
        dockStyle && "is-moved",
        edit && "is-movable",
        edit?.active === "button" && "is-active",
        dragging === "button" && "is-dragging",
      ),
      // ボタンの帯は画面の下に固定しているので、包まずに帯そのものをずらす（重なり順はそのまま）。
      style: dockStyle ? { transform: dockStyle.transform } : undefined,
      onPointerDown: edit ? (event) => pressDrag("button", event) : undefined,
    },
  };
  const head = (
    <div ref={headRef} className={cn("play-look-head", edit && "is-editing", dragging && "is-dragging", guide && "is-guide")}>
      {order.map((key) => {
        const part = parts[key];
        if (part == null) return null;
        if (key === "icon") return movable(key, part);
        const style = value.texts[key];
        const fine = style && !fineIsDefault(style) ? fineStyle(style) : null;
        if (!style && !edit) return movable(key, part);
        return movable(
          key,
          <div
            className={cn(
              "play-look-part",
              style?.color && "has-color",
              style?.bg && "has-bg",
              fine?.textShadow && "has-fx",
              fine?.fontWeight && "is-bold",
              fine?.letterSpacing && "has-ls",
              fine?.lineHeight && "has-lh",
              fine?.textAlign && "has-al",
              fine?.fontFamily && "has-ff",
            )}
            style={{
              ["--look-color" as string]: style?.color || undefined,
              ["--look-shadow" as string]: fine?.textShadow as string | undefined,
              ["--look-ls" as string]: fine?.letterSpacing as string | undefined,
              ["--look-lh" as string]: fine?.lineHeight as string | undefined,
              ["--look-al" as string]: fine?.textAlign as string | undefined,
              ["--look-ff" as string]: fine?.fontFamily as string | undefined,
              background: style?.bg || undefined,
              zoom: fine?.zoom,
              opacity: fine?.opacity,
            }}
            // 編集中は、タップでも選べるように（色を変えるため）。
            onClick={edit ? () => edit.onSelect(key) : undefined}
          >
            {part}
          </div>,
        );
      })}
      {value.shapes.length > 0 || value.images.length > 0 || extraTexts.length > 0 ? (
        // 足した図形・画像は、ほかの部品を押し下げずに上に重ねる。
        <div className="play-look-layer">
          {extraTexts.map((item) => {
            const className = "play-look-text";
            const textStyle = { color: item.color, background: item.bg || undefined, ...fineStyle(item) };
            if (edit) {
              return movable(
                `extra:${item.id}`,
                <textarea
                  className={`${className} is-edit${edit.active === `extra:${item.id}` ? " is-selected" : ""}`}
                  value={item.text}
                  placeholder="テキストを入力"
                  aria-label="追加したテキスト"
                  maxLength={120}
                  rows={Math.max(1, item.text.split("\n").length)}
                  style={textStyle}
                  onFocus={() => edit.onSelect(`extra:${item.id}`)}
                  onChange={(event) => edit.onExtraText(item.id, event.target.value)}
                />,
              );
            }
            return item.text.trim()
              ? movable(
                  `extra:${item.id}`,
                  <p className={className} style={textStyle}>
                    {item.text}
                  </p>,
                )
              : null;
          })}
          {value.images.map((item) => imageNode(item, edit?.active === `img:${item.id}`))}
          {value.shapes.map((item) => shapeNode(item, edit?.active === `shape:${item.id}`))}
        </div>
      ) : null}
    </div>
  );
  if (!renderForm) return head;
  return (
    <>
      {head}
      {renderForm(slots)}
    </>
  );
}

/**
 * プレイ中・クリアの画面の上の部分（種類・タイトル・名前など）と、その画面に足した図形・画像・テキスト。
 * 参加画面と同じしくみで、主催者が選んだ書式・位置で出す。edit があれば、プレビューの上で直接編集できる。
 */
export function PlayLookHead({
  look,
  screen,
  kicker,
  title,
  meta,
  edit,
}: {
  look: GameLook | null | undefined;
  screen: GameLookScreen;
  kicker: ReactNode;
  title: ReactNode;
  meta: ReactNode;
  edit?: GameStartHeaderEdit;
}) {
  return (
    <GameStartHeader
      look={lookForScreen(look, screen)}
      edit={edit}
      parts={{ icon: null, kicker, title, desc: null, meta }}
    />
  );
}

/** プレイ中・クリアの画面の中身を並べている要素（文章・コードなど）。 */
function clearBlocks(container: HTMLElement): HTMLElement[] {
  let root: Element | null = container.firstElementChild;
  // 外側を包んでいるだけの要素は、1段ずつ内側へ入る。
  for (let depth = 0; depth < 3 && root && root.children.length === 1; depth += 1) root = root.firstElementChild;
  const children = (el: Element) => Array.from(el.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
  if (!root) return [];
  // 下のボタン置き場（「答える」「一覧へ戻る」など）は、ボタンを1つずつ動かせるようにする。
  return children(root).flatMap((el) =>
    el.classList.contains("play-dock") && el.children.length > 1 ? children(el) : [el],
  );
}

/** 地図の上は、押したままの操作を地図を動かすのに使う（部品は選ぶだけ）。 */
const NO_DRAG = ".rally-map, .leaflet-container";

/**
 * 部品ごとのキー。クリアは上から数えた順（blk:<番号>）。
 * プレイ中は問題や一覧で並びが変わるので、部品の種類と、その種類の何番目か（pblk:<種類>.<番号>）で覚える。
 */
function blockKeys(blocks: HTMLElement[], screen: "play" | "clear"): string[] {
  if (screen === "clear") return blocks.map((_, index) => `blk:${index}`);
  const seen = new Map<string, number>();
  return blocks.map((el) => {
    const base = (el.classList[0] ?? el.tagName.toLowerCase()).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40) || "el";
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return `pblk:${base}.${count}`;
  });
}

/** 主催者の設定で上書きした書式と、上書きする前の値（もとに戻すため）。 */
const overridden = new WeakMap<HTMLElement, Map<string, string>>();
function restoreBlock(el: HTMLElement) {
  const saved = overridden.get(el);
  if (!saved) return;
  saved.forEach((value, name) => (value ? el.style.setProperty(name, value) : el.style.removeProperty(name)));
  overridden.delete(el);
}

export type ClearLayerEdit = {
  active: string | null;
  onSelect: (key: string) => void;
  onMove: (key: string, offset: StartOffset | null) => void;
};

/**
 * プレイ中・クリアの画面の中身（タブ・問題・写真・入力欄・ボタン、「クリア」「コード」など）を部品として扱う。
 * 主催者が付けた位置・書式を出す。edit があれば、プレビューの上で押して選び、ドラッグで動かせる。
 * 中身は各ゲームの部品が作るので、外から配置と書式だけを当てる。
 */
export function ClearLayer({
  look,
  enabled,
  screen = "clear",
  edit,
  children,
}: {
  look: GameLook | null | undefined;
  enabled: boolean;
  screen?: "play" | "clear";
  edit?: ClearLayerEdit;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const lookRef = useRef(look);
  const editRef = useRef(edit);
  // 最新の設定を、ドラッグ中の処理から読めるようにしておく（描画が終わってから入れ替える）。
  useLayoutEffect(() => {
    lookRef.current = look;
    editRef.current = edit;
  });
  const prefix = screen === "clear" ? "blk:" : "pblk:";
  // 設定がなく編集もしていなければ、何も当てない（参加者の画面を余計に触らない）。
  const hasSettings =
    Boolean(edit) ||
    Object.keys(look?.offsets ?? {}).some((key) => key.startsWith(prefix)) ||
    Object.keys(look?.blocks ?? {}).some((key) => key.startsWith(prefix));

  useLayoutEffect(() => {
    const container = ref.current;
    if (!enabled || !container || !hasSettings) return;
    const touched = new Set<HTMLElement>();
    const apply = () => {
      const current = lookRef.current;
      const card = container.closest<HTMLElement>(".play-game__card") ?? container;
      const blocks = clearBlocks(container);
      const keys = blockKeys(blocks, screen);
      blocks.forEach((el, index) => {
        const key = keys[index];
        const offset = current?.offsets?.[key];
        const style = current?.blocks?.[key];
        const fine = style ? fineStyle(style) : null;
        el.dataset.move = key;
        // 部品がもともと持っている見た目（特典の札など）は残し、その上に主催者の設定を重ねる。
        restoreBlock(el);
        const saved = new Map<string, string>();
        overridden.set(el, saved);
        touched.add(el);
        const set = (name: string, value: string | number | undefined | null | false) => {
          if (value === undefined || value === null || value === false || value === "") return;
          if (!saved.has(name)) saved.set(name, el.style.getPropertyValue(name));
          el.style.setProperty(name, String(value));
        };
        if (offset) {
          set("translate", `${(offset.x / 100) * card.offsetWidth}px ${(offset.y / 100) * card.offsetHeight}px`);
          // 動かした部品が、ほかの部品の下に隠れないように。
          if (getComputedStyle(el).position === "static") set("position", "relative");
          set("z-index", 2);
        }
        set("color", style?.color);
        if (style?.bg) {
          set("background", style.bg);
          set("padding", "0.35rem 0.8rem");
          set("border-radius", "0.7rem");
        }
        set("zoom", fine?.zoom);
        set("opacity", fine?.opacity);
        set("letter-spacing", fine?.letterSpacing);
        set("line-height", fine?.lineHeight);
        set("text-align", fine?.textAlign);
        set("font-family", fine?.fontFamily);
        set("font-weight", fine?.fontWeight);
        set("text-shadow", fine?.textShadow);
        const editing = Boolean(editRef.current);
        if (editing) {
          const active = editRef.current?.active === key;
          set("outline", active ? "2px solid #1f7a4a" : "1.5px dashed rgba(29, 42, 34, 0.25)");
          set("outline-offset", "3px");
          set("cursor", "grab");
          if (!el.matches(NO_DRAG) && !el.querySelector(NO_DRAG)) set("touch-action", "none");
          // ドラッグで文字が選択されて青くならないように。
          set("user-select", "none");
          set("-webkit-user-select", "none");
        }
      });
    };
    apply();
    // 中身が入れ替わったとき（結果が届いたとき・次の問題に進んだときなど）も、当て直す。
    const observer = new MutationObserver(apply);
    observer.observe(container, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      touched.forEach((el) => {
        restoreBlock(el);
        delete el.dataset.move;
      });
    };
  }, [enabled, screen, hasSettings, look, edit?.active, Boolean(edit)]);

  function onPointerDown(event: ReactPointerEvent) {
    const container = ref.current;
    const handler = editRef.current;
    if (!enabled || !handler || !container || event.button > 0) return;
    const blocks = clearBlocks(container);
    const index = blocks.findIndex((el) => el.contains(event.target as Node));
    if (index < 0) return;
    const key = blockKeys(blocks, screen)[index];
    handler.onSelect(key);
    if ((event.target as Element).closest(NO_DRAG)) return;
    const card = container.closest<HTMLElement>(".play-game__card") ?? container;
    const rect = card.getBoundingClientRect();
    const base = lookRef.current?.offsets?.[key] ?? { x: 0, y: 0 };
    const sx = event.clientX;
    const sy = event.clientY;
    let started = false;
    const onMove = (ev: PointerEvent) => {
      if (!started) {
        if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 6) return;
        started = true;
      }
      ev.preventDefault();
      handler.onMove(key, {
        x: Math.round((base.x + ((ev.clientX - sx) / rect.width) * 100) * 10) / 10,
        y: Math.round((base.y + ((ev.clientY - sy) / rect.height) * 100) * 10) / 10,
      });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      // ドラッグのあとは、下にあるボタンが押されないようにする。
      if (started) {
        const stop = (ev: Event) => ev.stopPropagation();
        window.addEventListener("click", stop, { capture: true, once: true });
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  return (
    <div ref={ref} onPointerDown={edit ? onPointerDown : undefined}>
      {children}
    </div>
  );
}

/**
 * スタート画面・クリア画面の演出（スタンプラリーと同じ、光の線とリボン）。カードの上に置く。
 * スタートは光の線だけ、クリアは「おめでとう！」「クリア！」のリボンとトロフィーも出す。
 * 主催者が背景（色・写真）を決めていれば、背景はそちらに任せて、光とリボンだけ重ねる。
 */
export function GameSceneBand({
  look,
  scene,
  clearTitle,
  congrats,
  progress,
}: {
  look: GameLook | null | undefined;
  scene: "start" | "play" | "clear";
  clearTitle?: string;
  congrats?: string;
  /** プレイ中：いくつ済んだか・全部でいくつか・クリアに必要な数。スタンプカードのように丸を並べて見せる。 */
  progress?: { done: number; total: number; needed: number };
}) {
  const custom = gameLookHasBg(look);
  if (scene === "play" && progress) {
    const left = Math.max(0, progress.needed - progress.done);
    const dots = Math.min(progress.total, 12);
    return (
      <div className={cn("game-scene", "game-scene--play", custom && "has-custom-bg")}>
        <div className="rally-burst" aria-hidden />
        <div className="game-scene__stamps" aria-hidden>
          {Array.from({ length: dots }, (_, index) => (
            <span key={index} className={cn("game-scene__stamp", index < progress.done && "is-done", index === progress.needed - 1 && "is-goal")}>
              {index < progress.done ? <Stamp /> : index === progress.needed - 1 ? <Trophy /> : index + 1}
            </span>
          ))}
        </div>
        <p className="game-scene__count">
          <b>{progress.done}</b> / {progress.needed}
          <span>{left > 0 ? `クリアまで、あと${left}つ` : "クリア条件を達成！"}</span>
        </p>
        <span className="game-scene__bar" aria-hidden>
          <span style={{ width: `${Math.min(100, (progress.done / Math.max(1, progress.needed)) * 100)}%` }} />
        </span>
      </div>
    );
  }
  return (
    <div className={cn("game-scene", `game-scene--${scene}`, custom && "has-custom-bg")} aria-hidden={scene === "start"}>
      <div className="rally-burst" aria-hidden />
      {scene === "clear" ? (
        <>
          <p className="rally-ribbon rally-ribbon--small">{congrats ?? "おめでとう！"}</p>
          <p className="rally-ribbon">{clearTitle ?? "クリア！"}</p>
          <span className="game-scene__trophy" aria-hidden>
            <Trophy />
          </span>
        </>
      ) : (
        <span className="game-scene__sparkle" aria-hidden>
          <Sparkles />
        </span>
      )}
    </div>
  );
}

/** プレイ中の進み具合（いくつ済んだか・全部でいくつか・クリアに必要な数）。ゲームの種類ごとの記録から読む。 */
export function gamePlayProgress(progress: {
  stampedCount: number;
  spotCount: number;
  quiz?: { needed: number };
  mission?: { needed: number };
  photo?: { needed: number };
  coupon?: { needed: number };
  checkin?: { needed: number };
  mystery?: { needed: number };
}): { done: number; total: number; needed: number } {
  const needed =
    progress.quiz?.needed ??
    progress.mission?.needed ??
    progress.photo?.needed ??
    progress.coupon?.needed ??
    progress.checkin?.needed ??
    progress.mystery?.needed ??
    progress.spotCount;
  return { done: progress.stampedCount, total: Math.max(progress.spotCount, needed), needed: Math.max(1, needed) };
}
