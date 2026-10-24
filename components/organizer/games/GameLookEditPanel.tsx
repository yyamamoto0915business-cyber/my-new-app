"use client";

import type { ReactNode } from "react";
import { Circle, ImagePlus, RotateCcw, Trash2, X } from "lucide-react";
import { FINE_HEAD_STYLE, FINE_PANEL_STYLE, FINE_ROWS_STYLE, TextFineControls } from "@/components/organizer/games/TextFineControls";
import { BgThemes, Choice, Row, SHADE_LABEL, Swatch } from "@/components/organizer/games/StartLookToolbar";
import { GAME_LOOK_ICON_COMPONENT } from "@/components/play/GameLook";
import {
  CARD_COLORS,
  START_IMAGE_SIZES,
  START_LOOK_SHADES,
  type GameStartImage,
} from "@/lib/organizer/game-experience";
import {
  DEFAULT_GAME_LOOK,
  FINE_DEFAULT,
  GAME_LOOK_ICONS,
  GAME_LOOK_ICON_LABEL,
  GAME_LOOK_TEXT_LABEL,
  type GameLook,
  type GameLookTextKey,
  type GameLookExtraText,
  fineIsDefault,
  type GameLookTextStyle,
} from "@/lib/organizer/game-look";
import { cn } from "@/lib/utils";

export type GameLookSelection = "icon" | "background" | "text" | "clearIcon";

/** プレビューでタップしたアイコン・背景の設定。スタンプラリーの設定パネルと同じ見た目。 */
export function GameLookEditPanel({
  selection,
  look,
  onLook,
  onPickImage,
  bgImageField,
  moved,
  onResetPosition,
  textKey,
  partLabel,
  onClose,
}: {
  /** 文字以外の部品（入力欄・参加ボタン）を選んでいるときの名前。 */
  partLabel?: string;
  /** 文字を選んでいるとき、その部品。 */
  textKey: GameLookTextKey | null;
  /** 選んでいる部品を動かしているか。 */
  moved: boolean;
  onResetPosition: () => void;
  selection: GameLookSelection;
  look: GameLook;
  onLook: (look: GameLook) => void;
  /** アイコンの絵・写真を選ぶ欄を開く。 */
  onPickImage: () => void;
  /** 背景の写真の選択欄（作成画面で作る）。 */
  bgImageField: ReactNode;
  onClose: () => void;
}) {
  const set = (patch: Partial<GameLook>) => onLook({ ...look, ...patch });
  const title =
    selection === "icon"
      ? "アイコン"
      : selection === "clearIcon"
        ? "クリアの絵"
      : selection === "text"
        ? textKey
          ? GAME_LOOK_TEXT_LABEL[textKey]
          : (partLabel ?? "文字")
        : "背景";
  const textStyle: GameLookTextStyle = (textKey && look.texts[textKey]) || { color: "", bg: "", ...FINE_DEFAULT };
  const setText = (patch: Partial<GameLookTextStyle>) => {
    if (!textKey) return;
    const next = { ...textStyle, ...patch };
    const texts = { ...look.texts };
    if (next.color || next.bg || !fineIsDefault(next)) texts[textKey] = next;
    else delete texts[textKey];
    set({ texts });
  };
  const resetButton = moved ? (
    <button type="button" className="edit-panel__choice" onClick={onResetPosition}>
      <RotateCcw aria-hidden />
      位置を元に戻す
    </button>
  ) : null;

  return (
    <div
      className="edit-panel"
      role="dialog"
      aria-label={`${title}の設定`}
      style={selection === "text" && textKey ? FINE_PANEL_STYLE : undefined}
    >
      <div className="edit-panel__head" style={selection === "text" && textKey ? FINE_HEAD_STYLE : undefined}>
        <b style={selection === "text" && textKey ? { display: "none" } : undefined}>{title}</b>
        <button type="button" onClick={onClose} aria-label="閉じる">
          <X aria-hidden />
        </button>
      </div>

      {selection === "icon" ? (
        <div className="edit-panel__rows">
          {look.iconImageUrl ? (
            <div className="look-edit__current">
              {/* eslint-disable-next-line @next/next/no-img-element -- 選んだ画像の見本 */}
              <img src={look.iconImageUrl} alt="" />
              <button type="button" className="edit-panel__choice" onClick={() => set({ iconImageUrl: "" })}>
                <RotateCcw aria-hidden />
                画像をやめる
              </button>
            </div>
          ) : null}
          <Row label="形">
            {GAME_LOOK_ICONS.map((id) => {
              const Icon = GAME_LOOK_ICON_COMPONENT[id];
              const on = !look.iconImageUrl && look.icon === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={cn("edit-panel__choice look-edit__choice", on && "is-on")}
                  aria-pressed={on}
                  aria-label={GAME_LOOK_ICON_LABEL[id]}
                  title={GAME_LOOK_ICON_LABEL[id]}
                  onClick={() => set({ icon: id, iconImageUrl: "" })}
                >
                  <Icon aria-hidden />
                </button>
              );
            })}
          </Row>
          <button type="button" className="edit-panel__choice" onClick={onPickImage}>
            <ImagePlus aria-hidden />
            イラスト・写真から選ぶ
          </button>
          <p className="edit-panel__note edit-panel__note--show">押したままドラッグで移動</p>
          {resetButton}
        </div>
      ) : selection === "clearIcon" ? (
        <div className="edit-panel__rows">
          <Row label="絵">
            {GAME_LOOK_ICONS.map((id) => {
              const Icon = GAME_LOOK_ICON_COMPONENT[id];
              const on = (look.clearIcon || "trophy") === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={cn("edit-panel__choice look-edit__choice", on && "is-on")}
                  aria-pressed={on}
                  aria-label={GAME_LOOK_ICON_LABEL[id]}
                  title={GAME_LOOK_ICON_LABEL[id]}
                  onClick={() => set({ clearIcon: id === "trophy" ? "" : id })}
                >
                  <Icon aria-hidden />
                </button>
              );
            })}
            <button
              type="button"
              className={cn("edit-panel__choice", look.clearIcon === "none" && "is-on")}
              aria-pressed={look.clearIcon === "none"}
              onClick={() => set({ clearIcon: "none" })}
            >
              出さない
            </button>
          </Row>
        </div>
      ) : selection === "text" ? (
        <div className="edit-panel__rows" style={textKey ? FINE_ROWS_STYLE : undefined}>
          {textKey ? (
            <TextFineControls
              value={textStyle}
              color={textStyle.color}
              bg={textStyle.bg}
              colorOriginalLabel="もとの色"
              onFine={setText}
              onColor={(color) => setText({ color })}
              onBg={(bg) => setText({ bg })}
            />
          ) : null}
          {textKey ? null : <p className="edit-panel__note edit-panel__note--show">押したままドラッグで移動</p>}
          {resetButton}
        </div>
      ) : (
        <div className="edit-panel__rows">
          <Row label="色">
            <BgThemes value={look.bgTheme} onPick={(bgTheme) => set({ bgTheme })} />
          </Row>
          <p className="edit-panel__note edit-panel__note--show">背景の写真を入れると、色より写真が優先されます</p>
          <div className="edit-panel__media edit-panel__media--one">{bgImageField}</div>
          {look.bgImageUrl ? (
            <Row label="暗さ">
              {START_LOOK_SHADES.map((shade) => (
                <Choice
                  key={shade}
                  on={look.shade === shade}
                  onClick={() => set({ shade })}
                  label={SHADE_LABEL[shade]}
                />
              ))}
            </Row>
          ) : null}
          {look.bgTheme || look.bgImageUrl ? (
            <button
              type="button"
              className="edit-panel__choice"
              onClick={() =>
                set({
                  bgTheme: DEFAULT_GAME_LOOK.bgTheme,
                  bgImageUrl: "",
                  shade: DEFAULT_GAME_LOOK.shade,
                })
              }
            >
              <RotateCcw aria-hidden />
              もとの背景に戻す
            </button>
          ) : null}
          {Object.keys(look.offsets).length > 0 ? (
            <button type="button" className="edit-panel__choice" onClick={() => set({ offsets: {} })}>
              <RotateCcw aria-hidden />
              すべての位置を元に戻す
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

const IMAGE_SIZE_LABEL: Record<GameStartImage["size"], string> = { s: "小", m: "中", l: "大" };

/** 足した画像を選んだときの設定。スタンプラリーの画像の設定と同じ。 */
export function GameLookImagePanel({
  image,
  onChange,
  onDelete,
  onClose,
}: {
  image: GameStartImage;
  onChange: (patch: Partial<GameStartImage>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <div className="edit-panel" role="dialog" aria-label={image.video ? "動画の設定" : "画像の設定"}>
      <div className="edit-panel__head">
        <b>{image.video ? "動画" : "画像"}</b>
        <button type="button" onClick={onClose} aria-label="閉じる">
          <X aria-hidden />
        </button>
      </div>
      <div className="edit-panel__rows">
        <Row label="大きさ">
          {START_IMAGE_SIZES.map((size) => (
            <Choice
              key={size}
              on={!image.width && image.size === size}
              onClick={() => onChange({ size, width: undefined })}
              label={IMAGE_SIZE_LABEL[size]}
            />
          ))}
        </Row>
        <p className="edit-panel__note edit-panel__note--show">2本の指・角のつまみで大きさを変えられます</p>
        <Row label="形">
          <Choice on={!image.round} onClick={() => onChange({ round: false })} label="そのまま" />
          <Choice on={image.round} onClick={() => onChange({ round: true })} label="丸く">
            <Circle aria-hidden />
          </Choice>
        </Row>
        <button type="button" className="edit-panel__danger" onClick={onDelete}>
          <Trash2 aria-hidden />
          {image.video ? "この動画を削除" : "この画像を削除"}
        </button>
      </div>
    </div>
  );
}

/** 足したテキストを選んだときの設定。 */
export function GameLookTextPanel({
  item,
  onChange,
  onDelete,
  onClose,
}: {
  item: GameLookExtraText;
  onChange: (patch: Partial<GameLookExtraText>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <div className="edit-panel" role="dialog" aria-label="テキストの設定" style={FINE_PANEL_STYLE}>
      <div className="edit-panel__head" style={FINE_HEAD_STYLE}>
        <b style={{ display: "none" }}>テキスト</b>
        <button type="button" onClick={onClose} aria-label="閉じる">
          <X aria-hidden />
        </button>
      </div>
      <div className="edit-panel__rows" style={FINE_ROWS_STYLE}>
        <TextFineControls
          value={item}
          color={item.color}
          bg={item.bg}
          onFine={onChange}
          onColor={(color) => onChange({ color })}
          onBg={(bg) => onChange({ bg })}
        />
        <button type="button" className="edit-panel__danger" onClick={onDelete}>
          <Trash2 aria-hidden />
          このテキストを削除
        </button>
      </div>
    </div>
  );
}

/** クリアの画面の中身（文章・コードなど）を選んだときの設定。 */
export function GameLookBlockPanel({
  style,
  moved,
  onChange,
  onResetPosition,
  onClose,
}: {
  style: GameLookTextStyle;
  moved: boolean;
  onChange: (patch: Partial<GameLookTextStyle>) => void;
  onResetPosition: () => void;
  onClose: () => void;
}) {
  return (
    <div className="edit-panel" role="dialog" aria-label="文字の設定" style={FINE_PANEL_STYLE}>
      <div className="edit-panel__head" style={FINE_HEAD_STYLE}>
        <b style={{ display: "none" }}>文字</b>
        <button type="button" onClick={onClose} aria-label="閉じる">
          <X aria-hidden />
        </button>
      </div>
      <div className="edit-panel__rows" style={FINE_ROWS_STYLE}>
        <TextFineControls
          value={style}
          color={style.color}
          bg={style.bg}
          colorOriginalLabel="もとの色"
          onFine={onChange}
          onColor={(color) => onChange({ color })}
          onBg={(bg) => onChange({ bg })}
        />
        {moved ? (
          <button type="button" className="edit-panel__choice" style={{ alignSelf: "flex-start" }} onClick={onResetPosition}>
            <RotateCcw aria-hidden />
            位置を元に戻す
          </button>
        ) : null}
      </div>
    </div>
  );
}
