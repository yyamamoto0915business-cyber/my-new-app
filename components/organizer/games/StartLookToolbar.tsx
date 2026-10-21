"use client";

import type { ReactNode } from "react";
import {
  AlignCenter,
  AlignLeft,
  ArrowDownToLine,
  ArrowUpToLine,
  Bold,
  Circle,
  FoldVertical,
  RotateCcw,
  Undo2,
  Trash2,
  X,
} from "lucide-react";
import type { StartMoveKey, StartSelection } from "@/components/play/rally/RallyStartScreen";
import type { RallyMomentSelection } from "@/components/play/rally/RallyMomentScreens";
import {
  START_LOOK_BUTTON_COLORS,
  START_LOOK_SHADES,
  START_LOOK_SIZES,
  START_LOOK_TEXT_COLORS,
  START_IMAGE_SIZES,
  GAME_REWARD_KINDS,
  GAME_REWARD_KIND_LABEL,
  GAME_STAMP_ANIMATIONS,
  GAME_STAMP_ANIMATION_LABEL,
  GAME_STAMP_SOUNDS,
  GAME_STAMP_SOUND_LABEL,
  LAYOUT_PART_LABEL,
  BG_THEMES,
  BG_THEME_LABEL,
  BG_THEME_SWATCH,
  type GameBgTheme,
  CARD_COLORS,
  type GameRewardKind,
  type GameScreenLayout,
  type GameStampAnimation,
  type GameStampSound,
  type GameStartImage,
  type GameStartLook,
  type GameStartText,
} from "@/lib/organizer/game-experience";
import { cn } from "@/lib/utils";

const SIZE_LABEL: Record<GameStartLook["size"], string> = { s: "小", m: "中", l: "大" };
const SHADE_LABEL: Record<GameStartLook["shade"], string> = { none: "なし", light: "うすく", strong: "こく" };
const TEXT_COLOR_LABEL: Record<GameStartLook["textColor"], string> = {
  "#ffffff": "白",
  "#fff4d6": "クリーム",
  "#1d2a22": "黒",
};

/**
 * プレビューでタップしたものだけの設定。何も選んでいなければ出さない。
 * 文字・追加したテキスト・ボタン・背景で、出す項目が変わる。
 */
export function StartEditPanel({
  selection,
  look,
  onLook,
  texts,
  onTextsChange,
  images,
  onImagesChange,
  media,
  onClose,
  onResetPosition,
  onResetAllPositions,
  movedKeys,
  showCharacter,
  onShowCharacter,
}: {
  showCharacter?: boolean;
  onShowCharacter?: (show: boolean) => void;
  onResetPosition: (key: StartMoveKey) => void;
  onResetAllPositions: () => void;
  /** ドラッグで動かしたもの。 */
  movedKeys: string[];
  selection: StartSelection;
  look: GameStartLook;
  onLook: (look: GameStartLook) => void;
  texts: GameStartText[];
  onTextsChange: (texts: GameStartText[]) => void;
  images: GameStartImage[];
  onImagesChange: (images: GameStartImage[]) => void;
  /** 背景の画像・動画の選択欄（ウィザード側で作る）。 */
  media: ReactNode;
  onClose: () => void;
}) {
  const set = (patch: Partial<GameStartLook>) => onLook({ ...look, ...patch });
  const extraId = selection.startsWith("extra:") ? selection.slice(6) : null;
  const extra = extraId ? (texts.find((item) => item.id === extraId) ?? null) : null;
  const patchExtra = (patch: Partial<GameStartText>) => {
    if (!extra) return;
    onTextsChange(texts.map((item) => (item.id === extra.id ? { ...item, ...patch } : item)));
  };

  const title =
    selection === "text"
      ? "文字"
      : selection === "button"
        ? "ボタン"
        : selection === "background"
          ? "背景"
          : selection === "mascot"
            ? "マスコット"
            : selection === "info"
              ? "案内カード"
              : selection.startsWith("img:")
                ? "画像"
                : "追加したテキスト";
  const imageId = selection.startsWith("img:") ? selection.slice(4) : null;
  const image = imageId ? (images.find((item) => item.id === imageId) ?? null) : null;
  const patchImage = (patch: Partial<GameStartImage>) => {
    if (!image) return;
    onImagesChange(images.map((item) => (item.id === image.id ? { ...item, ...patch } : item)));
  };
  // 文字は、キャッチコピー・タイトル・説明文をまとめて戻す。
  const moveKeys: StartMoveKey[] =
    selection === "text"
      ? ["catch", "title", "desc"]
      : selection === "background"
        ? []
        : [selection as StartMoveKey];
  const moved = moveKeys.some((key) => movedKeys.includes(key));
  const resetButton = moved ? (
    <button
      type="button"
      className="edit-panel__choice"
      onClick={() => moveKeys.forEach((key) => onResetPosition(key))}
    >
      <RotateCcw aria-hidden />
      位置を元に戻す
    </button>
  ) : null;

  return (
    <div className="edit-panel" role="dialog" aria-label={`${title}の設定`}>
      <div className="edit-panel__head">
        <b>{title}</b>
        <button type="button" onClick={onClose} aria-label="閉じる">
          <X aria-hidden />
        </button>
      </div>

      {selection === "text" ? (
        <div className="edit-panel__rows">
          <Row label="位置">
            <Choice on={look.position === "top"} onClick={() => set({ position: "top" })} label="上">
              <ArrowUpToLine aria-hidden />
            </Choice>
            <Choice on={look.position === "middle"} onClick={() => set({ position: "middle" })} label="中">
              <FoldVertical aria-hidden />
            </Choice>
            <Choice on={look.position === "bottom"} onClick={() => set({ position: "bottom" })} label="下">
              <ArrowDownToLine aria-hidden />
            </Choice>
          </Row>
          <Row label="揃え">
            <Choice on={look.align === "center"} onClick={() => set({ align: "center" })} label="中央">
              <AlignCenter aria-hidden />
            </Choice>
            <Choice on={look.align === "left"} onClick={() => set({ align: "left" })} label="左">
              <AlignLeft aria-hidden />
            </Choice>
          </Row>
          <Row label="大きさ">
            {START_LOOK_SIZES.map((size) => (
              <Choice key={size} on={look.size === size} onClick={() => set({ size })} label={SIZE_LABEL[size]} />
            ))}
          </Row>
          <Row label="色">
            {START_LOOK_TEXT_COLORS.map((color) => (
              <Swatch
                key={color}
                color={color}
                on={look.textColor === color}
                label={TEXT_COLOR_LABEL[color]}
                onClick={() => set({ textColor: color })}
              />
            ))}
          </Row>
          {resetButton}
        </div>
      ) : null}

      {extra ? (
        <div className="edit-panel__rows">
          <Row label="大きさ">
            {START_LOOK_SIZES.map((size) => (
              <Choice key={size} on={extra.size === size} onClick={() => patchExtra({ size })} label={SIZE_LABEL[size]} />
            ))}
            <Choice on={extra.bold} onClick={() => patchExtra({ bold: !extra.bold })} label="太字">
              <Bold aria-hidden />
            </Choice>
          </Row>
          <Row label="色">
            {START_LOOK_TEXT_COLORS.map((color) => (
              <Swatch
                key={color}
                color={color}
                on={extra.color === color}
                label={TEXT_COLOR_LABEL[color]}
                onClick={() => patchExtra({ color })}
              />
            ))}
          </Row>
          {resetButton}
          <button
            type="button"
            className="edit-panel__danger"
            onClick={() => {
              onTextsChange(texts.filter((item) => item.id !== extra.id));
              onClose();
            }}
          >
            <Trash2 aria-hidden />
            このテキストを削除
          </button>
        </div>
      ) : null}

      {image ? (
        <div className="edit-panel__rows">
          <Row label="大きさ">
            {START_IMAGE_SIZES.map((size) => (
              <Choice
                key={size}
                on={!image.width && image.size === size}
                onClick={() => patchImage({ size, width: undefined })}
                label={SIZE_LABEL[size]}
              />
            ))}
          </Row>
          <p className="edit-panel__note edit-panel__note--show">2本の指・角のつまみで大きさを変えられます</p>
          <Row label="形">
            <Choice on={!image.round} onClick={() => patchImage({ round: false })} label="そのまま" />
            <Choice on={image.round} onClick={() => patchImage({ round: true })} label="丸く">
              <Circle aria-hidden />
            </Choice>
          </Row>
          {resetButton}
          <button
            type="button"
            className="edit-panel__danger"
            onClick={() => {
              onImagesChange(images.filter((item) => item.id !== image.id));
              onResetPosition(`img:${image.id}`);
              onClose();
            }}
          >
            <Trash2 aria-hidden />
            この画像を削除
          </button>
        </div>
      ) : null}

      {selection === "button" ? (
        <div className="edit-panel__rows">
          <Row label="色">
            {START_LOOK_BUTTON_COLORS.map((color) => (
              <Swatch
                key={color}
                color={color}
                on={look.buttonColor === color}
                label={color}
                onClick={() => set({ buttonColor: color })}
              />
            ))}
          </Row>
          <p className="edit-panel__note">文字はボタンの上をタップして直せます。</p>
          {resetButton}
        </div>
      ) : null}

      {selection === "mascot" || selection === "info" ? (
        <div className="edit-panel__rows">
          <p className="edit-panel__note edit-panel__note--show">押したままドラッグで移動</p>
          {resetButton}
        </div>
      ) : null}

      {selection === "background" ? (
        <div className="edit-panel__rows">
          <Row label="色">
            <BgThemes value={look.bgTheme ?? ""} onPick={(bgTheme) => set({ bgTheme })} />
          </Row>
          <p className="edit-panel__note edit-panel__note--show">背景の画像・動画を入れると、色より画像が優先されます</p>
          <div className="edit-panel__media">{media}</div>
          <Row label="暗さ">
            {START_LOOK_SHADES.map((shade) => (
              <Choice key={shade} on={look.shade === shade} onClick={() => set({ shade })} label={SHADE_LABEL[shade]} />
            ))}
          </Row>
          {movedKeys.length > 0 ? (
            <button type="button" className="edit-panel__choice" onClick={onResetAllPositions}>
              <RotateCcw aria-hidden />
              すべての位置を元に戻す
            </button>
          ) : null}
          {(look.hidden ?? []).map((key) => (
            <button
              key={key}
              type="button"
              className="edit-panel__choice"
              onClick={() => onLook({ ...look, hidden: (look.hidden ?? []).filter((item) => item !== key) })}
            >
              <Undo2 aria-hidden />
              {LAYOUT_PART_LABEL[key] ?? key}を戻す
            </button>
          ))}
          {showCharacter === false && onShowCharacter ? (
            <button type="button" className="edit-panel__choice" onClick={() => onShowCharacter(true)}>
              <Undo2 aria-hidden />
              マスコットを戻す
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** 背景の色のテーマを選ぶ丸。 */
function BgThemes({ value, onPick }: { value: GameBgTheme; onPick: (theme: GameBgTheme) => void }) {
  return (
    <>
      {BG_THEMES.map((theme) =>
        theme ? (
          <button
            key={theme}
            type="button"
            className={cn("edit-panel__swatch", value === theme && "is-on")}
            aria-pressed={value === theme}
            aria-label={BG_THEME_LABEL[theme]}
            title={BG_THEME_LABEL[theme]}
            style={{ background: BG_THEME_SWATCH[theme] }}
            onClick={() => onPick(theme)}
          />
        ) : (
          <button
            key="default"
            type="button"
            className={cn("edit-panel__choice", value === "" && "is-on")}
            aria-pressed={value === ""}
            onClick={() => onPick("")}
          >
            もとの色
          </button>
        ),
      )}
    </>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="edit-panel__row">
      <span>{label}</span>
      <div>{children}</div>
    </div>
  );
}

function Choice({
  on,
  onClick,
  label,
  children,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
  children?: ReactNode;
}) {
  return (
    <button type="button" className={cn("edit-panel__choice", on && "is-on")} aria-pressed={on} onClick={onClick}>
      {children}
      {label}
    </button>
  );
}

function Swatch({ color, on, label, onClick }: { color: string; on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={cn("edit-panel__swatch", on && "is-on")}
      aria-pressed={on}
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{ background: color }}
    />
  );
}


/** スタンプGET・特典の画面で、タップしたものの設定。 */
export function MomentEditPanel({
  screen,
  selection,
  layout,
  onLayout,
  animation,
  sound,
  onStamp,
  stampImageField,
  rewardKind,
  onRewardKind,
  rewardImageField,
  bgImageField,
  onClose,
}: {
  screen: "stamp" | "clear" | "home";
  selection: RallyMomentSelection;
  layout: GameScreenLayout;
  onLayout: (layout: GameScreenLayout) => void;
  animation: GameStampAnimation;
  sound: GameStampSound;
  onStamp: (patch: { animation?: GameStampAnimation; sound?: GameStampSound }) => void;
  stampImageField: ReactNode;
  rewardKind: GameRewardKind;
  onRewardKind: (kind: GameRewardKind) => void;
  rewardImageField: ReactNode;
  bgImageField: ReactNode;
  onClose: () => void;
}) {
  const save = (patch: Partial<GameScreenLayout>) => onLayout({ ...layout, ...patch });
  const extraId = selection.startsWith("extra:") ? selection.slice(6) : null;
  const extra = extraId ? (layout.texts.find((item) => item.id === extraId) ?? null) : null;
  const imageId = selection.startsWith("img:") ? selection.slice(4) : null;
  const image = imageId ? (layout.images.find((item) => item.id === imageId) ?? null) : null;
  const patchExtra = (patch: Partial<GameStartText>) =>
    extra && save({ texts: layout.texts.map((item) => (item.id === extra.id ? { ...item, ...patch } : item)) });
  const patchImage = (patch: Partial<GameStartImage>) =>
    image && save({ images: layout.images.map((item) => (item.id === image.id ? { ...item, ...patch } : item)) });
  const moveKey =
    selection === "background" ? null : selection === "rewardBox" ? "card" : (selection as string);
  const isCard = selection === "card" || selection === "meter" || selection === "book" || selection === "next";
  const moved = moveKey ? Boolean(layout.offsets[moveKey]) : false;
  const resetPosition = (key: string) => {
    const offsets = { ...layout.offsets };
    delete offsets[key];
    save({ offsets });
  };
  const resetButton =
    moveKey && moved ? (
      <button type="button" className="edit-panel__choice" onClick={() => resetPosition(moveKey)}>
        <RotateCcw aria-hidden />
        位置を元に戻す
      </button>
    ) : null;
  const remove = (key: string) => {
    const offsets = { ...layout.offsets };
    delete offsets[key];
    if (key.startsWith("img:")) save({ offsets, images: layout.images.filter((item) => `img:${item.id}` !== key) });
    else save({ offsets, texts: layout.texts.filter((item) => `extra:${item.id}` !== key) });
    onClose();
  };

  const title =
    selection === "seal"
      ? "スタンプの絵と演出"
      : selection === "trophy" || selection === "rewardBox"
        ? "特典"
        : selection === "background"
          ? "背景"
          : selection === "ribbon"
            ? "タイトルの帯"
            : selection === "name"
              ? "スポット名"
              : selection === "msg"
                ? "メッセージ"
                : selection === "card"
                  ? "カード"
                  : selection === "meter" || selection === "book" || selection === "next"
                    ? `${LAYOUT_PART_LABEL[selection] ?? "スタンプ帳"}のカード`
                    : selection === "bookTitle" || selection === "nextTitle"
                      ? "見出し"
                  : selection === "congrats" || selection === "lead" || selection === "title"
                    ? LAYOUT_PART_LABEL[selection]
                    : image
                    ? "画像"
                    : "追加したテキスト";

  return (
    <div className="edit-panel" role="dialog" aria-label={`${title}の設定`}>
      <div className="edit-panel__head">
        <b>{title}</b>
        <button type="button" onClick={onClose} aria-label="閉じる">
          <X aria-hidden />
        </button>
      </div>

      {selection === "seal" ? (
        <div className="edit-panel__rows">
          <div className="edit-panel__media edit-panel__media--one">{stampImageField}</div>
          <Row label="演出">
            {GAME_STAMP_ANIMATIONS.map((item) => (
              <Choice
                key={item}
                on={animation === item}
                onClick={() => onStamp({ animation: item })}
                label={GAME_STAMP_ANIMATION_LABEL[item]}
              />
            ))}
          </Row>
          <Row label="音">
            {GAME_STAMP_SOUNDS.map((item) => (
              <Choice
                key={item}
                on={sound === item}
                onClick={() => onStamp({ sound: item })}
                label={GAME_STAMP_SOUND_LABEL[item]}
              />
            ))}
          </Row>
          {resetButton}
        </div>
      ) : null}

      {selection === "trophy" || selection === "rewardBox" ? (
        <div className="edit-panel__rows">
          <Row label="種類">
            {GAME_REWARD_KINDS.map((item) => (
              <Choice
                key={item}
                on={rewardKind === item}
                onClick={() => onRewardKind(item)}
                label={item === "name" ? "そのほか" : GAME_REWARD_KIND_LABEL[item]}
              />
            ))}
          </Row>
          {rewardKind === "badge" ? (
            <div className="edit-panel__media edit-panel__media--one">{rewardImageField}</div>
          ) : null}
          {resetButton}
        </div>
      ) : null}

      {selection === "msg" && screen === "stamp" ? (
        <div className="edit-panel__rows">
          <Row label="色">
            {START_LOOK_TEXT_COLORS.map((color) => (
              <Swatch
                key={color}
                color={color}
                on={layout.textColor === color}
                label={TEXT_COLOR_LABEL[color]}
                onClick={() => save({ textColor: color })}
              />
            ))}
          </Row>
          {resetButton}
        </div>
      ) : null}

      {isCard ? (
        <div className="edit-panel__rows">
          {(
            [
              ["bg", "カード"],
              ["number", "数字"],
              ["text", "文字"],
              ["accent", "ボタン・バー"],
            ] as const
          ).map(([field, label]) => (
            <Row key={field} label={label}>
              <button
                type="button"
                className={cn("edit-panel__choice", !layout.card?.[field] && "is-on")}
                aria-pressed={!layout.card?.[field]}
                onClick={() => save({ card: { ...layout.card, [field]: "" } })}
              >
                もとの色
              </button>
              {CARD_COLORS.map((color) => (
                <Swatch
                  key={color}
                  color={color}
                  on={layout.card?.[field] === color}
                  label={color}
                  onClick={() => save({ card: { ...layout.card, [field]: color } })}
                />
              ))}
            </Row>
          ))}
          {resetButton}
        </div>
      ) : null}

      {selection === "bookTitle" || selection === "nextTitle" ? (
        <div className="edit-panel__rows">
          <Row label="色">
            <button
              type="button"
              className={cn("edit-panel__choice", !layout.titleColor && "is-on")}
              aria-pressed={!layout.titleColor}
              onClick={() => save({ titleColor: "" })}
            >
              もとの色
            </button>
            {CARD_COLORS.map((color) => (
              <Swatch
                key={color}
                color={color}
                on={layout.titleColor === color}
                label={color}
                onClick={() => save({ titleColor: color })}
              />
            ))}
          </Row>
          <p className="edit-panel__note edit-panel__note--show">見出しの文字はタップして直せます（空ならもとの文字）</p>
          {resetButton}
        </div>
      ) : null}

      {selection === "ribbon" ||
      selection === "name" ||
      selection === "congrats" ||
      selection === "lead" ||
      selection === "title" ||
      (selection === "msg" && screen === "clear") ? (
        <div className="edit-panel__rows">
          <p className="edit-panel__note edit-panel__note--show">押したままドラッグで移動</p>
          {resetButton}
        </div>
      ) : null}

      {extra ? (
        <div className="edit-panel__rows">
          <Row label="大きさ">
            {START_LOOK_SIZES.map((size) => (
              <Choice key={size} on={extra.size === size} onClick={() => patchExtra({ size })} label={SIZE_LABEL[size]} />
            ))}
            <Choice on={extra.bold} onClick={() => patchExtra({ bold: !extra.bold })} label="太字">
              <Bold aria-hidden />
            </Choice>
          </Row>
          <Row label="色">
            {START_LOOK_TEXT_COLORS.map((color) => (
              <Swatch
                key={color}
                color={color}
                on={extra.color === color}
                label={TEXT_COLOR_LABEL[color]}
                onClick={() => patchExtra({ color })}
              />
            ))}
          </Row>
          {resetButton}
          <button type="button" className="edit-panel__danger" onClick={() => remove(`extra:${extra.id}`)}>
            <Trash2 aria-hidden />
            このテキストを削除
          </button>
        </div>
      ) : null}

      {image ? (
        <div className="edit-panel__rows">
          <Row label="大きさ">
            {START_IMAGE_SIZES.map((size) => (
              <Choice
                key={size}
                on={!image.width && image.size === size}
                onClick={() => patchImage({ size, width: undefined })}
                label={SIZE_LABEL[size]}
              />
            ))}
          </Row>
          <p className="edit-panel__note edit-panel__note--show">2本の指・角のつまみで大きさを変えられます</p>
          <Row label="形">
            <Choice on={!image.round} onClick={() => patchImage({ round: false })} label="そのまま" />
            <Choice on={image.round} onClick={() => patchImage({ round: true })} label="丸く">
              <Circle aria-hidden />
            </Choice>
          </Row>
          {resetButton}
          <button type="button" className="edit-panel__danger" onClick={() => remove(`img:${image.id}`)}>
            <Trash2 aria-hidden />
            この画像を削除
          </button>
        </div>
      ) : null}

      {selection === "background" ? (
        <div className="edit-panel__rows">
          <Row label="色">
            <BgThemes value={layout.bgTheme ?? ""} onPick={(bgTheme) => save({ bgTheme })} />
          </Row>
          <Row label="光の線">
            <Choice on={layout.rays !== false} onClick={() => save({ rays: true })} label="あり" />
            <Choice on={layout.rays === false} onClick={() => save({ rays: false })} label="なし" />
          </Row>
          <div className="edit-panel__media">{bgImageField}</div>
          <Row label="写真の見え方">
            {START_LOOK_SHADES.map((shade) => (
              <Choice key={shade} on={layout.shade === shade} onClick={() => save({ shade })} label={SHADE_LABEL[shade]} />
            ))}
          </Row>
          {Object.keys(layout.offsets).length > 0 ? (
            <button type="button" className="edit-panel__choice" onClick={() => save({ offsets: {} })}>
              <RotateCcw aria-hidden />
              すべての位置を元に戻す
            </button>
          ) : null}
          {layout.hidden.map((key) => (
            <button
              key={key}
              type="button"
              className="edit-panel__choice"
              onClick={() => save({ hidden: layout.hidden.filter((item) => item !== key) })}
            >
              <Undo2 aria-hidden />
              {LAYOUT_PART_LABEL[key] ?? key}を戻す
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
