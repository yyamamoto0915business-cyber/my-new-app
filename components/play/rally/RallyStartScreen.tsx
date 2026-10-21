"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ImageIcon,
  Flag,
  Gift,
  MapPin,
  QrCode,
  Share2,
  Stamp,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import {
  DEFAULT_START_LOOK,
  sanitizeStartOffsets,
  type GameHowtoIcon,
  type StartOffset,
} from "@/lib/organizer/game-experience";
import { usePlayCopy } from "@/components/play/usePlayCopy";
import type { PlayStart } from "@/components/play/rally/types";
import { useMoveLayer } from "@/components/play/rally/useMoveLayer";
import "./rally.css";

const HOWTO_ICONS: Record<GameHowtoIcon, LucideIcon> = {
  pin: MapPin,
  qr: QrCode,
  stamp: Stamp,
  gift: Gift,
  flag: Flag,
};

export type StartEditField = "title" | "catchCopy" | "description" | "buttonLabel";
/** プレビューで選んでいるもの。"extra:<id>" は足したテキスト。 */
export type StartSelection = "text" | "button" | "background" | "mascot" | "info" | `extra:${string}` | `img:${string}` | `shape:${string}`;
/** ドラッグで動かせるもの。 */
export type StartMoveKey =
  "mascot" | "catch" | "title" | "desc" | "info" | "button" | `extra:${string}` | `img:${string}` | `shape:${string}`;
export type StartEdit = {
  onChange: (field: StartEditField, value: string) => void;
  /** 足したテキストの書き換え。 */
  onTextChange: (id: string, value: string) => void;
  selected: StartSelection | null;
  onSelect: (selection: StartSelection) => void;
  /** ドラッグで動かした位置（画面に対する %）。null で元の位置に戻す。 */
  onMove: (key: StartMoveKey, offset: StartOffset | null) => void;
  /** 画像・図形の幅（画面に対する %）を変える。key は img:<id> か shape:<id>。 */
  onResize: (key: string, width: number) => void;
  /** ボタンの文字。 */
  onShapeLabel: (id: string, label: string) => void;
  /** 足した画像・テキストやマスコットを、画面から消す。 */
  onDelete: (key: StartMoveKey) => void;
};

/** 中身に合わせて高さが伸びる入力欄。プレビューの文字と同じ見た目で書き換える。 */
export function GrowText({
  value,
  placeholder,
  className,
  maxLength,
  label,
  color,
  onFocus,
  onChange,
}: {
  value: string;
  placeholder: string;
  className: string;
  maxLength: number;
  label: string;
  color?: string;
  onFocus?: () => void;
  onChange: (value: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    };
    fit();
    // 文字の大きさや揃え、幅が変わったときも高さを合わせ直す。
    const observer = new ResizeObserver(() => fit());
    observer.observe(el);
    const timer = window.setTimeout(fit, 50);
    void document.fonts?.ready.then(fit);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [value, className]);
  return (
    <textarea
      ref={ref}
      className={`${className} rally-edit`}
      value={value}
      placeholder={placeholder}
      maxLength={maxLength}
      rows={1}
      aria-label={label}
      style={color ? { color } : undefined}
      onFocus={onFocus}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function RallyStartScreen({
  start,
  title,
  fallbackDescription,
  showLogin,
  loginHref,
  shareNote,
  onShare,
  onStart,
  preview = false,
  edit,
}: {
  /** 主催者のプレビュー。未入力のところを、見本と分かる形で出す。 */
  preview?: boolean;
  /** 主催者がプレビューの上で直接書き換える。渡したときだけ、文字が入力欄になる。 */
  edit?: StartEdit;
  start: PlayStart | null;
  title: string;
  fallbackDescription: string;
  showLogin: boolean;
  loginHref: string;
  shareNote: string | null;
  onShare: () => void;
  onStart: () => void;
}) {
  const copy = usePlayCopy();
  const description = start?.description.trim() || fallbackDescription;
  const buttonLabel = start?.buttonLabel.trim() || "ラリーをはじめる";
  const hasMedia = Boolean(start?.videoUrl || start?.imageUrl);
  const look = { ...DEFAULT_START_LOOK, ...(start?.look ?? {}) };
  const extraTexts = start?.extraTexts ?? [];
  const extraImages = start?.extraImages ?? [];
  const extraShapes = start?.extraShapes ?? [];
  const offsets = sanitizeStartOffsets(start?.look?.offsets);
  const hidden = new Set(start?.look?.hidden ?? []);

  const mainRef = useRef<HTMLElement>(null);
  const [textKey, setTextKey] = useState<StartMoveKey>("title");
  const activeKey: StartMoveKey | null = !edit?.selected
    ? null
    : edit.selected === "text"
      ? textKey
      : edit.selected === "background"
        ? null
        : (edit.selected as StartMoveKey);
  const layer = useMoveLayer({
    containerRef: mainRef,
    offsets,
    activeKey,
    edit: edit
      ? {
          onMove: (key, offset) => edit.onMove(key as StartMoveKey, offset),
          onResize: edit.onResize,
          onShapeLabel: edit.onShapeLabel,
          onDelete: (key) => edit.onDelete(key as StartMoveKey),
          onSelectKey: (key) => {
            if (key === "catch" || key === "title" || key === "desc") {
              setTextKey(key);
              edit.onSelect("text");
            } else edit.onSelect(key as StartSelection);
          },
          canDelete: (key) =>
            key === "mascot" ||
            key === "catch" ||
            key === "desc" ||
            key === "info" ||
            key.startsWith("img:") ||
            key.startsWith("shape:") ||
            key.startsWith("extra:"),
        }
      : undefined,
  });
  const { movable, startDrag, dragging, guide } = layer;

  const showInfo = Boolean(start?.periodLabel || start?.showFreeBadge || (start && start.steps.length > 0));

  return (
    <main
      ref={mainRef}
      className={[
        "rally-start",
        hasMedia ? "" : "rally-start--plain",
        !hasMedia && look.bgTheme ? `rally-bg--${look.bgTheme}` : "",
        `rally-start--pos-${look.position}`,
        `rally-start--align-${look.align}`,
        `rally-start--size-${look.size}`,
        `rally-start--shade-${look.shade}`,
        look.textColor === "#1d2a22" ? "rally-start--dark-text" : "",
        edit ? "is-editing" : "",
        edit?.selected === "background" ? "is-bg-selected" : "",
        edit?.selected === "text" ? "is-text-selected" : "",
        edit?.selected === "button" ? "is-button-selected" : "",
        dragging ? "is-dragging" : "",
        guide ? "is-guide" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ ["--start-text" as string]: look.textColor, ["--start-button" as string]: look.buttonColor }}
      onClick={
        edit
          ? (event) => {
              // 文字やボタン以外（背景）をタップしたら、背景を選ぶ。
              if (layer.justGestured()) return;
              const target = event.target as HTMLElement;
              if (
                target.closest(
                  "textarea, input, button, a, .rally-start__info, .rally-cta, .rally-start__character, .rally-start__img, .rally-shape",
                )
              )
                return;
              edit.onSelect("background");
            }
          : undefined
      }
    >
      <div className="rally-start__media" aria-hidden>
        {start?.videoUrl ? (
          <video src={start.videoUrl} poster={start.imageUrl || undefined} autoPlay muted loop playsInline />
        ) : start?.imageUrl ? (
          <img src={start.imageUrl} alt="" />
        ) : null}
      </div>
      <div className="rally-start__shade" aria-hidden />

      <div className="rally-start__body">
        <div className="rally-start__hero">
          {start?.showCharacter
            ? movable(
                "mascot",
                <Image
                  className="rally-start__character"
                  src="/organizer/games/loading-mascot-1.png"
                  alt=""
                  width={64}
                  height={64}
                  draggable={false}
                  onPointerDown={
                    edit
                      ? (event) => {
                          edit.onSelect("mascot");
                          startDrag("mascot", event);
                        }
                      : undefined
                  }
                />,
              )
            : null}
          {edit ? (
            <>
              {!hidden.has("catch") &&
                movable(
                  "catch",
                  <GrowText
                    className={`rally-start__catch look-${look.size}-${look.align}`}
                    value={start?.catchCopy ?? ""}
                    placeholder="キャッチコピーを入力"
                    maxLength={60}
                    label="キャッチコピー"
                    onFocus={() => {
                      setTextKey("catch");
                      edit.onSelect("text");
                    }}
                    onChange={(value) => edit.onChange("catchCopy", value)}
                  />,
                )}
              {movable(
                "title",
                <GrowText
                  className={`rally-start__title look-${look.size}-${look.align}`}
                  value={title}
                  placeholder="タイトルを入力"
                  maxLength={60}
                  label="タイトル"
                  onFocus={() => {
                    setTextKey("title");
                    edit.onSelect("text");
                  }}
                  onChange={(value) => edit.onChange("title", value)}
                />,
              )}
              {!hidden.has("desc") &&
                movable(
                  "desc",
                  <GrowText
                    className={`rally-start__desc look-${look.size}-${look.align}`}
                    value={start?.description ?? ""}
                    placeholder="説明文を入力"
                    maxLength={300}
                    label="説明文"
                    onFocus={() => {
                      setTextKey("desc");
                      edit.onSelect("text");
                    }}
                    onChange={(value) => edit.onChange("description", value)}
                  />,
                )}
              {extraTexts.map((item) =>
                movable(
                  `extra:${item.id}`,
                  <GrowText
                    key={item.id}
                    className={`rally-start__extra rally-start__extra--${item.size}${item.bold ? " is-bold" : ""}${
                      edit.selected === `extra:${item.id}` ? " is-selected" : ""
                    } look-${look.align}`}
                    value={item.text}
                    placeholder="テキストを入力"
                    maxLength={120}
                    label="追加したテキスト"
                    color={item.color}
                    onFocus={() => edit.onSelect(`extra:${item.id}`)}
                    onChange={(value) => edit.onTextChange(item.id, value)}
                  />,
                ),
              )}
              {extraImages.map((item) => layer.imageNode(item, edit.selected === `img:${item.id}`))}
              {extraShapes.map((item) => layer.shapeNode(item, edit.selected === `shape:${item.id}`))}
              {hasMedia ? null : (
                <button
                  type="button"
                  className="rally-start__placeholder-bg rally-edit-bg"
                  onClick={() => edit.onSelect("background")}
                >
                  <ImageIcon aria-hidden />
                  背景の画像・動画を入れる
                </button>
              )}
            </>
          ) : (
            <>
              {hidden.has("catch") ? null : start?.catchCopy ? (
                movable("catch", <p className="rally-start__catch">{start.catchCopy}</p>)
              ) : preview ? (
                <p className="rally-start__catch rally-start__placeholder">キャッチコピー未入力</p>
              ) : null}
              {title ? (
                movable("title", <h1 className="rally-start__title">{title}</h1>)
              ) : (
                <h1 className="rally-start__title rally-start__placeholder">タイトル未入力</h1>
              )}
              {hidden.has("desc") ? null : description ? (
                movable("desc", <p className="rally-start__desc">{description}</p>)
              ) : preview ? (
                <p className="rally-start__desc rally-start__placeholder">説明文未入力</p>
              ) : null}
              {extraTexts
                .filter((item) => item.text.trim())
                .map((item) =>
                  movable(
                    `extra:${item.id}`,
                    <p
                      className={`rally-start__extra rally-start__extra--${item.size}${item.bold ? " is-bold" : ""}`}
                      style={{ color: item.color }}
                    >
                      {item.text}
                    </p>,
                  ),
                )}
              {extraImages.map((item) => layer.imageNode(item, false))}
              {extraShapes.map((item) => layer.shapeNode(item, false))}
              {preview && !hasMedia ? (
                <p className="rally-start__placeholder-bg">背景の画像・動画は未設定です</p>
              ) : null}
            </>
          )}
        </div>

        <div className="rally-start__foot">
          {showInfo && !hidden.has("info")
            ? movable(
                "info",
                <div
                  className="rally-start__info"
                  onPointerDown={
                    edit
                      ? (event) => {
                          edit.onSelect("info");
                          startDrag("info", event);
                        }
                      : undefined
                  }
                >
                  {start?.periodLabel ? (
                    <p>
                      <CalendarDays aria-hidden />
                      {copy.msg(start.periodLabel)}
                    </p>
                  ) : null}
                  {start?.showFreeBadge ? (
                    <p className="rally-start__free">
                      <Ticket aria-hidden />
                      {copy.freeToJoin}
                    </p>
                  ) : null}
                  {start && start.steps.length > 0 ? (
                    <ol className="rally-start__steps">
                      {start.steps.map((step, index) => {
                        const Icon = HOWTO_ICONS[step.icon];
                        return (
                          <li key={`${step.icon}-${index}`}>
                            <span aria-hidden>
                              <Icon />
                            </span>
                            {step.label}
                          </li>
                        );
                      })}
                    </ol>
                  ) : null}
                </div>,
              )
            : null}

          {movable(
            "button",
            edit ? (
              <div className="rally-cta rally-cta--edit" onClick={() => edit.onSelect("button")}>
                <input
                  className="rally-edit"
                  value={start?.buttonLabel ?? ""}
                  placeholder="ラリーをはじめる"
                  maxLength={20}
                  aria-label="ボタンの文字"
                  onFocus={() => edit.onSelect("button")}
                  onChange={(event) => edit.onChange("buttonLabel", event.target.value)}
                />
                <ArrowRight aria-hidden />
              </div>
            ) : (
              <button type="button" className="rally-cta" onClick={onStart}>
                {copy.msg(buttonLabel)}
                <ArrowRight aria-hidden />
              </button>
            ),
          )}
          {showLogin || start?.showShare ? (
            <div className="rally-start__sub">
              {showLogin ? (
                <Link className="rally-start__subbtn" href={loginHref}>
                  {copy.login}
                </Link>
              ) : null}
              {start?.showShare ? (
                <button type="button" className="rally-start__subbtn" onClick={onShare}>
                  <Share2 aria-hidden />
                  {copy.share}
                </button>
              ) : null}
            </div>
          ) : null}
          {shareNote ? (
            <p className="rally-start__note" role="status">
              {copy.msg(shareNote)}
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
