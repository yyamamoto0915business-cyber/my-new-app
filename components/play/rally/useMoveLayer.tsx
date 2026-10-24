"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { Move, X } from "lucide-react";
import {
  START_IMAGE_MAX_WIDTH,
  START_IMAGE_MIN_WIDTH,
  START_IMAGE_WIDTH,
  type GameShapeKind,
  type GameStartImage,
  type GameStartShape,
  type GameStartText,
  type StartOffset,
} from "@/lib/organizer/game-experience";

/** 動かせるものの入れ物。ずれは transform で足すので、ほかの並びは崩さない。 */
export function Movable({
  moveKey,
  style,
  active,
  dragging,
  editing,
  onHandle,
  onPress,
  onDelete,
  children,
}: {
  /** 部品そのものを押したとき（そのままドラッグすると動かせる）。 */
  onPress?: (key: string, event: ReactPointerEvent) => void;
  /** 渡すと、選んでいるときに右上へ × を出す。 */
  onDelete?: () => void;
  moveKey: string;
  style: CSSProperties | undefined;
  active: boolean;
  dragging: boolean;
  editing: boolean;
  onHandle: (key: string, event: ReactPointerEvent) => void;
  children: ReactNode;
}) {
  return (
    <div
      className={`rally-move${active ? " is-active" : ""}${dragging ? " is-dragging" : ""}`}
      style={style}
      data-move={moveKey}
      onPointerDown={editing && onPress ? (event) => onPress(moveKey, event) : undefined}
    >
      {children}
      {editing && active ? (
        <button
          type="button"
          className="rally-move__handle"
          aria-label="ドラッグして動かす"
          title="ドラッグして動かす"
          onPointerDown={(event) => onHandle(moveKey, event)}
        >
          <Move aria-hidden />
        </button>
      ) : null}
      {editing && active && onDelete ? (
        <button
          type="button"
          className="rally-move__delete"
          aria-label="消す"
          title="消す"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
        >
          <X aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

export type MoveLayerEdit = {
  /** ドラッグで動かした位置（画面に対する %）。null で元の位置に戻す。 */
  onMove: (key: string, offset: StartOffset | null) => void;
  /** 画像・図形の幅（画面に対する %）を変える。key は img:<id> か shape:<id>。 */
  onResize: (key: string, width: number) => void;
  /** ボタンの文字を書き換える。 */
  onShapeLabel?: (id: string, label: string) => void;
  /** 消せるもの（足した画像・テキストなど）を消す。 */
  onDelete: (key: string) => void;
  /** × を出してよいもの。 */
  canDelete: (key: string) => boolean;
  /** 部品を押したとき・ドラッグしはじめたとき、その部品を選ぶ。 */
  onSelectKey: (key: string) => void;
};

export const imageWidthOf = (item: GameStartImage) => item.width ?? START_IMAGE_WIDTH[item.size];

/** 図形の形（100×100 の中に描く）。 */
const SHAPE_PATH: Record<Exclude<GameShapeKind, "button">, ReactNode> = {
  rect: <rect x="0" y="0" width="100" height="100" />,
  rounded: <rect x="0" y="0" width="100" height="100" rx="16" />,
  circle: <circle cx="50" cy="50" r="50" />,
  triangle: <polygon points="50,3 97,95 3,95" />,
  star: <polygon points="50,2 61,37 98,37 68,59 79,95 50,73 21,95 32,59 2,37 39,37" />,
  heart: <path d="M50 92 C 20 70 2 52 2 31 C 2 15 14 4 28 4 C 38 4 46 10 50 18 C 54 10 62 4 72 4 C 86 4 98 15 98 31 C 98 52 80 70 50 92 Z" />,
  arrow: <polygon points="0,35 58,35 58,12 100,50 58,88 58,65 0,65" />,
};
/** 縦横比（高さ ÷ 幅）。 */
const SHAPE_RATIO: Record<Exclude<GameShapeKind, "button">, number> = {
  rect: 0.66,
  rounded: 0.66,
  circle: 1,
  triangle: 1,
  star: 1,
  heart: 0.95,
  arrow: 0.6,
};
/** ボタンの色に合わせて、読みやすい文字の色を選ぶ。 */
function buttonTextColor(color: string): string {
  const n = parseInt(color.slice(1), 16);
  const lum = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return lum > 170 ? "#1d2a22" : "#ffffff";
}

const clampWidth = (w: number) =>
  Math.round(Math.min(START_IMAGE_MAX_WIDTH, Math.max(START_IMAGE_MIN_WIDTH, w)) * 10) / 10;

/**
 * 画面の上で、部品をドラッグで動かす・画像の大きさを変えるしくみ。
 * スタート・スタンプGET・クリアの画面で共通に使う。edit がなければ、保存した配置で見せるだけ。
 */
export function useMoveLayer({
  containerRef,
  offsets,
  activeKey,
  edit,
}: {
  containerRef: RefObject<HTMLElement | null>;
  offsets: Record<string, StartOffset>;
  /** いま選んでいて、つまみや × を出すもの。 */
  activeKey: string | null;
  edit?: MoveLayerEdit;
}) {
  // ずれ（%）を px にするため、画面の大きさを測る。縮小表示でも offsetWidth は縮む前の大きさ。
  const [size, setSize] = useState({ w: 390, h: 844 });
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.offsetWidth || 390, h: el.offsetHeight || 844 });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef]);

  const [dragging, setDragging] = useState<string | null>(null);
  const [guide, setGuide] = useState(false);
  /** ドラッグや大きさ変更の直後のクリックで、背景が選ばれてしまわないように。 */
  const gestureEndRef = useRef(0);
  const pinchRef = useRef<{ id: string; startDist: number; startWidth: number } | null>(null);
  const touchesRef = useRef(new Map<number, { x: number; y: number }>());

  const moveStyle = (key: string): CSSProperties | undefined => {
    const offset = offsets[key];
    if (!offset) return undefined;
    return { transform: `translate(${(offset.x * size.w) / 100}px, ${(offset.y * size.h) / 100}px)`, zIndex: 2 };
  };

  function startDrag(key: string, event: ReactPointerEvent) {
    const main = containerRef.current;
    if (!edit || !main) return;
    event.preventDefault();
    event.stopPropagation();
    // 画面上の大きさ（縮小表示ならその分）で割るので、縮小していても指の動きと同じだけ動く。
    const rect = main.getBoundingClientRect();
    const base = offsets[key] ?? { x: 0, y: 0 };
    const sx = event.clientX;
    const sy = event.clientY;
    let moved = false;
    setDragging(key);
    const onMove = (ev: PointerEvent) => {
      // 2本の指で大きさを変えているあいだは、動かさない。
      if (pinchRef.current) return;
      const dx = ((ev.clientX - sx) / rect.width) * 100;
      const dy = ((ev.clientY - sy) / rect.height) * 100;
      if (!moved && Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 3) return;
      moved = true;
      let x = base.x + dx;
      const y = base.y + dy;
      // 元の縦の並び（中央揃えなら真ん中）に近づいたら吸いつける。
      const snapped = Math.abs(x) < 2;
      if (snapped) x = 0;
      setGuide(snapped);
      edit.onMove(key, { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      setDragging(null);
      gestureEndRef.current = performance.now();
      setGuide(false);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  /**
   * 部品そのものを押したとき。すぐには動かさず、少し動いたらドラッグにする。
   * 動かさずに離せば、ふつうのタップ（選ぶ・文字を入力する）になる。
   */
  function pressDrag(key: string, event: ReactPointerEvent) {
    const main = containerRef.current;
    if (!edit || !main || event.button > 0) return;
    // 中の部品（カードの中の文字など）を押したときは、いちばん内側だけが受け持つ。
    event.stopPropagation();
    const target = event.target as HTMLElement;
    // 入力中の欄の上では、文字の選択を優先する。
    if (target.closest("textarea, input") && document.activeElement === target.closest("textarea, input")) return;
    if (target.closest("button:not(.is-editable), a")) return;
    const rect = main.getBoundingClientRect();
    const base = offsets[key] ?? { x: 0, y: 0 };
    const sx = event.clientX;
    const sy = event.clientY;
    let started = false;
    const onMove = (ev: PointerEvent) => {
      if (pinchRef.current) return;
      if (!started) {
        if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 6) return;
        started = true;
        setDragging(key);
        edit.onSelectKey?.(key);
        (document.activeElement as HTMLElement | null)?.blur?.();
        window.getSelection()?.removeAllRanges();
      }
      ev.preventDefault();
      let x = base.x + ((ev.clientX - sx) / rect.width) * 100;
      const y = base.y + ((ev.clientY - sy) / rect.height) * 100;
      const snapped = Math.abs(x) < 2;
      if (snapped) x = 0;
      setGuide(snapped);
      edit.onMove(key, { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (!started) return;
      setDragging(null);
      setGuide(false);
      gestureEndRef.current = performance.now();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  // 画像に触れている指。2本になったら、指の間の広さで大きさを変える（ピンチ）。
  function sizedPointerDown(key: string, width: number, event: ReactPointerEvent) {
    if (!edit) return;
    const touches = touchesRef.current;
    touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
    edit.onSelectKey(key);
    if (touches.size === 1) {
      startDrag(key, event);
      const onMove = (ev: PointerEvent) => {
        if (!touches.has(ev.pointerId)) return;
        touches.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
        const pinch = pinchRef.current;
        if (!pinch || touches.size < 2) return;
        const [a, b] = [...touches.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        edit.onResize(pinch.id, clampWidth(pinch.startWidth * (dist / pinch.startDist)));
      };
      const onUp = (ev: PointerEvent) => {
        touches.delete(ev.pointerId);
        if (touches.size < 2) pinchRef.current = null;
        if (touches.size === 0) {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          window.removeEventListener("pointercancel", onUp);
        }
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      return;
    }
    if (touches.size === 2) {
      event.preventDefault();
      const [a, b] = [...touches.values()];
      pinchRef.current = {
        id: key,
        startDist: Math.max(10, Math.hypot(a.x - b.x, a.y - b.y)),
        startWidth: width,
      };
    }
  }

  /** 右下の角をドラッグして大きさを変える（PC やひとさし指1本でも使える）。 */
  function startResize(key: string, startWidth: number, event: ReactPointerEvent) {
    const main = containerRef.current;
    if (!edit || !main) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = main.getBoundingClientRect();
    const sx = event.clientX;
    const sy = event.clientY;
    setDragging(key);
    const onMove = (ev: PointerEvent) => {
      // 絵は真ん中から広がるので、角の動きの2倍ぶん幅を変える。斜めの動きは大きいほうを使う。
      const d = Math.max(ev.clientX - sx, ev.clientY - sy);
      edit.onResize(key, clampWidth(startWidth + ((d * 2) / rect.width) * 100));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      setDragging(null);
      gestureEndRef.current = performance.now();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  const movable = (key: string, children: ReactNode) => (
    <Movable
      key={key}
      moveKey={key}
      style={moveStyle(key)}
      active={activeKey === key}
      dragging={dragging === key}
      editing={Boolean(edit)}
      onHandle={startDrag}
      onPress={edit ? pressDrag : undefined}
      onDelete={edit && edit.canDelete(key) ? () => edit.onDelete(key) : undefined}
    >
      {children}
    </Movable>
  );

  /** 足した画像。編集中は直接ドラッグ・ピンチ・角のつまみで動かす。 */
  const imageNode = (item: GameStartImage, selected: boolean) =>
    movable(
      `img:${item.id}`,
      <span className="rally-start__imgbox" style={{ width: `${imageWidthOf(item)}cqw` }}>
        {item.video ? (
          <video
            className={`rally-start__img${item.round ? " is-round" : ""}`}
            src={item.url}
            // 編集中は音が出ないよう無音でくり返す。参加者の画面では、操作バーで再生・音を切り替えられる。
            autoPlay
            muted
            loop
            playsInline
            controls={!edit}
            preload="metadata"
            style={{ width: "100%", display: "block", background: "#000" }}
            onPointerDown={edit ? (event) => sizedPointerDown(`img:${item.id}`, imageWidthOf(item), event) : undefined}
          />
        ) : (
        <img
          className={`rally-start__img${item.round ? " is-round" : ""}`}
          src={item.url}
          alt=""
          draggable={false}
          onPointerDown={edit ? (event) => sizedPointerDown(`img:${item.id}`, imageWidthOf(item), event) : undefined}
          onWheel={
            edit
              ? (event) => {
                  // トラックパッドのピンチ（ctrl＋ホイール）でも大きさを変える。
                  if (!event.ctrlKey || !selected) return;
                  edit.onResize(`img:${item.id}`, clampWidth(imageWidthOf(item) * Math.exp(-event.deltaY * 0.01)));
                }
              : undefined
          }
        />
        )}
        {edit && selected ? (
          <button
            type="button"
            className="rally-start__resize"
            aria-label="ドラッグして大きさを変える"
            title="ドラッグして大きさを変える"
            onPointerDown={(event) => startResize(`img:${item.id}`, imageWidthOf(item), event)}
          />
        ) : null}
      </span>,
    );

  /** 足した図形・ボタン。編集中は画像と同じく、ドラッグ・ピンチ・角のつまみで動かす。 */
  const shapeNode = (item: GameStartShape, selected: boolean) => {
    const key = `shape:${item.id}`;
    const press = edit ? (event: ReactPointerEvent) => sizedPointerDown(key, item.width, event) : undefined;
    let body: ReactNode;
    if (item.kind === "button") {
      const label = item.label || "ボタン";
      const style = { background: item.color, color: buttonTextColor(item.color) };
      body =
        edit && selected && edit.onShapeLabel ? (
          <span className="rally-shape__button" style={style}>
            <input
              className="rally-shape__input"
              value={item.label}
              placeholder="ボタンの文字"
              maxLength={30}
              aria-label="ボタンの文字"
              style={{ color: style.color }}
              onPointerDown={(event) => event.stopPropagation()}
              onChange={(event) => edit.onShapeLabel?.(item.id, event.target.value)}
            />
          </span>
        ) : !edit && item.href ? (
          <a className="rally-shape__button" style={style} href={item.href} target="_blank" rel="noopener noreferrer">
            {label}
          </a>
        ) : (
          <span className="rally-shape__button" style={style} onPointerDown={press}>
            {label}
          </span>
        );
    } else {
      body = (
        <svg
          className="rally-shape__svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ aspectRatio: `1 / ${SHAPE_RATIO[item.kind]}`, fill: item.color }}
          onPointerDown={press}
          aria-hidden
        >
          {SHAPE_PATH[item.kind]}
        </svg>
      );
    }
    return movable(
      key,
      <span
        className={`rally-shape rally-shape--${item.kind}`}
        style={{ width: `${item.width}cqw`, opacity: item.opacity / 100 }}
      >
        {body}
        {edit && selected ? (
          <button
            type="button"
            className="rally-start__resize"
            aria-label="ドラッグして大きさを変える"
            title="ドラッグして大きさを変える"
            onPointerDown={(event) => startResize(key, item.width, event)}
          />
        ) : null}
      </span>,
    );
  };

  /** 参加者の画面での、足したテキスト。 */
  const textView = (item: GameStartText) =>
    item.text.trim()
      ? movable(
          `extra:${item.id}`,
          <p
            className={`rally-start__extra rally-start__extra--${item.size}${item.bold ? " is-bold" : ""}`}
            style={{ color: item.color }}
          >
            {item.text}
          </p>,
        )
      : null;

  return {
    dragging,
    guide,
    gestureEndRef,
    startDrag,
    /** 部品を包まずに動かすとき（画面の下に固定したボタンなど）の、ずれの style と押したときの処理。 */
    moveStyle,
    pressDrag,
    movable,
    imageNode,
    shapeNode,
    textView,
    /** 直前にドラッグなどをしたばかりなら true（そのクリックは無視する）。 */
    justGestured: () => performance.now() - gestureEndRef.current < 400,
  };
}
