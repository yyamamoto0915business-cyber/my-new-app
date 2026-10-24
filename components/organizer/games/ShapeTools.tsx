"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";
import {
  START_SHAPE_COLORS,
  START_SHAPE_KINDS,
  START_SHAPE_LABEL,
  type GameShapeKind,
  type GameStartShape,
} from "@/lib/organizer/game-experience";
import { cn } from "@/lib/utils";

/** 選ぶ欄に出す、図形の小さな見本。 */
function ShapeIcon({ kind }: { kind: GameShapeKind }) {
  if (kind === "button") return <span className="shape-pick__btn">ボタン</span>;
  const paths: Record<Exclude<GameShapeKind, "button">, React.ReactNode> = {
    rect: <rect x="8" y="22" width="84" height="56" />,
    rounded: <rect x="8" y="22" width="84" height="56" rx="14" />,
    circle: <circle cx="50" cy="50" r="40" />,
    triangle: <polygon points="50,10 92,88 8,88" />,
    star: <polygon points="50,6 61,38 95,38 67,58 78,92 50,72 22,92 33,58 5,38 39,38" />,
    heart: <path d="M50 88 C 22 68 6 52 6 33 C 6 18 17 8 30 8 C 39 8 46 13 50 21 C 54 13 61 8 70 8 C 83 8 94 18 94 33 C 94 52 78 68 50 88 Z" />,
    arrow: <polygon points="6,38 58,38 58,18 94,50 58,82 58,62 6,62" />,
  };
  return (
    <svg viewBox="0 0 100 100" aria-hidden>
      {paths[kind]}
    </svg>
  );
}

/** 「＋ 図形」で開く、図形を選ぶ欄。（ボタンは新しく足せない。作成済みのものは編集できる） */
export function ShapePicker({ onPick, onClose }: { onPick: (kind: GameShapeKind) => void; onClose: () => void }) {
  return (
    <div className="edit-panel shape-pick" role="dialog" aria-label="図形を追加">
      <div className="edit-panel__head">
        <b>図形を追加</b>
        <button type="button" onClick={onClose} aria-label="閉じる">
          <X aria-hidden />
        </button>
      </div>
      <div className="shape-pick__grid">
        {START_SHAPE_KINDS.filter((kind) => kind !== "button").map((kind) => (
          <button key={kind} type="button" onClick={() => onPick(kind)} title={START_SHAPE_LABEL[kind]}>
            <ShapeIcon kind={kind} />
            <small>{START_SHAPE_LABEL[kind]}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

/** 図形・ボタンを選んだときの設定。 */
export function ShapeEditPanel({
  shape,
  onChange,
  onDelete,
  onClose,
}: {
  shape: GameStartShape;
  onChange: (patch: Partial<GameStartShape>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [hrefDraft, setHrefDraft] = useState(shape.href);
  const [hrefError, setHrefError] = useState<string | null>(null);
  function saveHref(value: string) {
    const raw = value.trim();
    if (!raw) {
      setHrefError(null);
      onChange({ href: "" });
      return;
    }
    try {
      const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
      if (url.protocol !== "https:") throw new Error("https");
      setHrefError(null);
      setHrefDraft(url.href);
      onChange({ href: url.href });
    } catch {
      setHrefError("https:// から始まるページを入れてください");
    }
  }
  return (
    <div className="edit-panel" role="dialog" aria-label={`${START_SHAPE_LABEL[shape.kind]}の設定`}>
      <div className="edit-panel__head">
        <b>{START_SHAPE_LABEL[shape.kind]}</b>
        <button type="button" onClick={onClose} aria-label="閉じる">
          <X aria-hidden />
        </button>
      </div>
      <div className="edit-panel__rows">
        <div className="edit-panel__row">
          <span>色</span>
          <div>
            {START_SHAPE_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={cn("edit-panel__swatch", shape.color === color && "is-on")}
                aria-pressed={shape.color === color}
                aria-label={color}
                style={{ background: color }}
                onClick={() => onChange({ color })}
              />
            ))}
          </div>
        </div>
        <div className="edit-panel__row">
          <span>透明度</span>
          <div>
            {[100, 75, 50, 25].map((opacity) => (
              <button
                key={opacity}
                type="button"
                className={cn("edit-panel__choice", shape.opacity === opacity && "is-on")}
                aria-pressed={shape.opacity === opacity}
                onClick={() => onChange({ opacity })}
              >
                {opacity === 100 ? "なし" : `${100 - opacity}%`}
              </button>
            ))}
          </div>
        </div>
        {shape.kind === "button" ? (
          <div className="edit-panel__row edit-panel__row--link">
            <span>リンク</span>
            <div>
              <input
                className="edit-panel__input"
                value={hrefDraft}
                placeholder="https://（空なら押しても何もしない）"
                inputMode="url"
                onChange={(event) => setHrefDraft(event.target.value)}
                onBlur={(event) => saveHref(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") saveHref((event.target as HTMLInputElement).value);
                }}
              />
            </div>
          </div>
        ) : null}
        {hrefError ? <p className="edit-panel__note edit-panel__note--show edit-panel__error">{hrefError}</p> : null}
        <p className="edit-panel__note edit-panel__note--show">
          {shape.kind === "button" ? "文字はボタンを押して直せます。" : ""}2本の指・角のつまみで大きさを変えられます
        </p>
        <button type="button" className="edit-panel__danger" onClick={onDelete}>
          <Trash2 aria-hidden />
          削除
        </button>
      </div>
    </div>
  );
}
