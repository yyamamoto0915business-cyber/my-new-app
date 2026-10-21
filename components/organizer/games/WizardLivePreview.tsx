"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { RallyApp } from "@/components/play/rally/RallyApp";
import {
  RallyStartScreen,
  type StartEdit,
  type StartMoveKey,
  type StartSelection,
} from "@/components/play/rally/RallyStartScreen";
import type { PlayStart, RallyStampEvent, RallyTab } from "@/components/play/rally/types";
import {
  publicPlayMoment,
  publicPlayStart,
  type GameExperience,
  type GameExperienceSpot,
  type GameScreenId,
  type GameStartLook,
  type GameRewardKind,
  type GameScreenLayout,
  type GameStampAnimation,
  type GameStampSound,
  type GameShapeKind,
  type GameStartImage,
  type GameStartShape,
  START_SHAPE_DEFAULT_WIDTH,
  START_SHAPE_MAX,
  type GameStartText,
  type StartOffset,
  START_IMAGE_MAX,
  START_TEXT_MAX,
} from "@/lib/organizer/game-experience";
import { ImagePlus, Plus, Shapes, Wallpaper, X } from "lucide-react";
import { ShapeEditPanel, ShapePicker } from "@/components/organizer/games/ShapeTools";
import { StartImagePicker } from "@/components/organizer/games/StartImagePicker";
import { MomentEditPanel, StartEditPanel } from "@/components/organizer/games/StartLookToolbar";
import type {
  RallyMomentEdit,
  RallyMomentField,
  RallyMomentScreen,
  RallyMomentSelection,
} from "@/components/play/rally/RallyMomentScreens";
import type { PlayProgress } from "@/lib/organizer/play-types";
import { ORGANIZER_GAME_SPOT_KIND_LABEL, type OrganizerGameSpotKind } from "@/lib/organizer/game-tokens";
import { cn } from "@/lib/utils";
import "@/components/play/rally/rally.css";
import "./wizard-preview.css";

/** iPhone 14/15 の画面（CSS ピクセル）と、枠の太さ。 */
const SCREEN_W = 390;
const SCREEN_H = 844;
const BEZEL = 12;
const PHONE_W = SCREEN_W + BEZEL * 2;
const PHONE_H = SCREEN_H + BEZEL * 2;

type PreviewSpot = GameExperienceSpot & { key: string; name: string; kind: OrganizerGameSpotKind };
type View = "start" | "home" | "map" | "stamp" | "reward";

const VIEWS: { id: View; label: string }[] = [
  { id: "start", label: "スタート" },
  { id: "home", label: "ホーム" },
  { id: "map", label: "マップ" },
  { id: "stamp", label: "スタンプGET" },
  { id: "reward", label: "特典" },
];

/** 作成中の画面（タブ）から、まず見せる参加者画面。 */
export function previewViewFor(screen: GameScreenId, step: number): View {
  if (step === 3) return "map";
  if (step === 5) return "reward";
  if (screen === "spot") return "map";
  if (screen === "stamp") return "stamp";
  if (screen === "clear") return "reward";
  return "start";
}

/**
 * 参加者が実際に見る画面を、作成中のデータでスマホ枠の中に出す。
 * 枠に transform をかけ、画面内の固定表示（下タブ・演出）を枠の中に閉じこめる。
 */
export function WizardLivePreview({
  name,
  periodLabel,
  experience,
  spots,
  view,
  onView,
  edit,
  className,
}: {
  /** 渡すと、スタート画面の文字をプレビューの上で書き換えられる。 */
  edit?: Omit<StartEdit, "selected" | "onSelect" | "onMove" | "onResize" | "onShapeLabel" | "onDelete"> & {
    /** スタンプGET・特典の画面の書き換え。 */
    moment: {
      onChange: (field: RallyMomentField, value: string) => void;
      onStamp: (patch: { animation?: GameStampAnimation; sound?: GameStampSound }) => void;
      onRewardKind: (kind: GameRewardKind) => void;
      stampImageField: ReactNode;
      rewardImageField: ReactNode;
      /** 配置・足したテキストや画像・背景。 */
      onLayout: (screen: RallyMomentScreen, layout: GameScreenLayout) => void;
      /** 背景の画像を選ぶ欄。 */
      bgImageField: (screen: RallyMomentScreen) => ReactNode;
    };
    /** マスコットを出すかどうか。 */
    onShowCharacter: (show: boolean) => void;
    onLook: (look: GameStartLook) => void;
    media: ReactNode;
    onTextsChange: (texts: GameStartText[]) => void;
    onImagesChange: (images: GameStartImage[]) => void;
    onShapesChange: (shapes: GameStartShape[]) => void;
    /** スタート画面の背景の画像・動画を外す。 */
    onClearStartMedia: () => void;
    /** 写真のアップロード欄（ウィザード側で作る。gameId が要るため）。 */
    uploadField: (onUploaded: (url: string) => void) => ReactNode;
  };
  name: string;
  periodLabel: string | null;
  experience: GameExperience;
  spots: PreviewSpot[];
  view: View;
  onView: (view: View) => void;
  className?: string;
}) {
  const [nonce, setNonce] = useState(0);
  /** プレビューでタップして選んだもの。選んでいるあいだだけ、その設定を出す。 */
  const [selected, setSelected] = useState<StartSelection | null>(null);
  const [momentSelected, setMomentSelected] = useState<RallyMomentSelection | null>(null);
  useEffect(() => {
    setMomentSelected(null);
  }, [view]);
  const momentScreen: RallyMomentScreen | null = view === "stamp" ? "stamp" : view === "reward" ? "clear" : null;
  const momentLayout = momentScreen === "stamp" ? experience.screens.stamp.layout : experience.screens.clear.layout;
  const momentEdit: RallyMomentEdit | undefined =
    edit && momentScreen
      ? {
          onChange: edit.moment.onChange,
          selected: momentSelected,
          onSelect: setMomentSelected,
          onLayout: edit.moment.onLayout,
          rewardImageUrl: experience.reward.imageUrl,
        }
      : undefined;
  const [momentPlace, setMomentPlace] = useState<"top" | "bottom">("bottom");
  useEffect(() => {
    if (!momentSelected) return;
    const key =
      momentSelected === "background" ? null : momentSelected === "rewardBox" ? "card" : momentSelected;
    const id = window.requestAnimationFrame(() => {
      const el = key ? stageRef.current?.querySelector(`[data-move="${key}"]`) : null;
      if (!el) {
        setMomentPlace("bottom");
        return;
      }
      const rect = el.getBoundingClientRect();
      setMomentPlace(rect.top + rect.height / 2 > window.innerHeight / 2 ? "top" : "bottom");
    });
    return () => window.cancelAnimationFrame(id);
  }, [momentSelected, momentLayout.offsets]);
  /** 選んだものが画面の下半分にあれば設定を上に、上半分なら下に出す（隠さないように）。 */
  const [panelPlace, setPanelPlace] = useState<"top" | "bottom">("bottom");
  const startEdit: StartEdit | undefined = edit
    ? {
        onChange: edit.onChange,
        onTextChange: edit.onTextChange,
        selected,
        onSelect: setSelected,
        onMove: (key, offset) => moveTo(key, offset),
        onDelete: (key) => deleteItem(key),
        onResize: (key, width) => {
          const id = key.slice(key.indexOf(":") + 1);
          if (key.startsWith("img:")) {
            edit.onImagesChange(
              experience.screens.start.extraImages.map((item) => (item.id === id ? { ...item, width } : item)),
            );
          } else {
            edit.onShapesChange(
              experience.screens.start.extraShapes.map((item) => (item.id === id ? { ...item, width } : item)),
            );
          }
        },
        onShapeLabel: (id, label) =>
          edit.onShapesChange(
            experience.screens.start.extraShapes.map((item) => (item.id === id ? { ...item, label } : item)),
          ),
      }
    : undefined;
  const look = experience.screens.start.look;
  function deleteItem(key: StartMoveKey) {
    if (!edit) return;
    if (key === "mascot") edit.onShowCharacter(false);
    else if (key === "catch" || key === "desc" || key === "info") {
      const offsets = { ...(look.offsets ?? {}) };
      delete offsets[key];
      edit.onLook({ ...look, offsets, hidden: [...new Set([...(look.hidden ?? []), key])] });
      setSelected(null);
      return;
    }
    else if (key.startsWith("img:")) {
      const id = key.slice(4);
      edit.onImagesChange(experience.screens.start.extraImages.filter((item) => item.id !== id));
    } else if (key.startsWith("shape:")) {
      const id = key.slice(6);
      edit.onShapesChange(experience.screens.start.extraShapes.filter((item) => item.id !== id));
    } else if (key.startsWith("extra:")) {
      const id = key.slice(6);
      edit.onTextsChange(experience.screens.start.extraTexts.filter((item) => item.id !== id));
    }
    moveTo(key, null);
    setSelected(null);
  }
  function moveTo(key: StartMoveKey, offset: StartOffset | null) {
    if (!edit) return;
    const offsets = { ...(look.offsets ?? {}) };
    if (offset) offsets[key] = offset;
    else delete offsets[key];
    edit.onLook({ ...look, offsets });
  }
  useEffect(() => {
    if (!selected) return;
    const place = () => {
      const stage = stageRef.current;
      if (!stage) return;
      const target =
        selected === "button"
          ? stage.querySelector(".rally-cta--edit")
          : selected === "text"
            ? (stage.querySelector("textarea.rally-start__title") ?? stage.querySelector("textarea.rally-start__catch"))
            : selected.startsWith("extra:")
              ? stage.querySelector("textarea.rally-start__extra.is-selected")
              : selected === "mascot" || selected === "info" || selected.startsWith("img:") || selected.startsWith("shape:")
                ? stage.querySelector(`[data-move="${selected}"]`)
                : null;
      if (!target) {
        setPanelPlace("bottom");
        return;
      }
      const rect = target.getBoundingClientRect();
      setPanelPlace(rect.top + rect.height / 2 > window.innerHeight / 2 ? "top" : "bottom");
    };
    // 選択の枠（is-selected）が付いてから測る。
    const id = window.requestAnimationFrame(place);
    window.addEventListener("resize", place);
    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener("resize", place);
    };
  }, [selected, experience.screens.start.look.position, experience.screens.start.look.offsets]);

  // ＋テキスト・＋画像は、いま見ている画面（スタート・スタンプGET・クリア）に足す。
  const texts = momentScreen ? momentLayout.texts : experience.screens.start.extraTexts;
  const images = momentScreen ? momentLayout.images : experience.screens.start.extraImages;
  function setTexts(next: GameStartText[]) {
    if (!edit) return;
    if (momentScreen) edit.moment.onLayout(momentScreen, { ...momentLayout, texts: next });
    else edit.onTextsChange(next);
  }
  function setImages(next: GameStartImage[]) {
    if (!edit) return;
    if (momentScreen) edit.moment.onLayout(momentScreen, { ...momentLayout, images: next });
    else edit.onImagesChange(next);
  }
  const [picking, setPicking] = useState(false);
  function addImage(url: string, size: GameStartImage["size"] = "m") {
    if (!edit || !url || images.length >= START_IMAGE_MAX) return;
    const id = `i${Date.now().toString(36)}`;
    setImages([...images, { id, url, size, round: false }]);
    setPicking(false);
    if (momentScreen) setMomentSelected(`img:${id}`);
    else setSelected(`img:${id}`);
  }

  const shapes = momentScreen ? (momentLayout.shapes ?? []) : experience.screens.start.extraShapes;
  function setShapes(next: GameStartShape[]) {
    if (!edit) return;
    if (momentScreen) edit.moment.onLayout(momentScreen, { ...momentLayout, shapes: next });
    else edit.onShapesChange(next);
  }
  const [pickingShape, setPickingShape] = useState(false);
  function addShape(kind: GameShapeKind) {
    if (!edit || shapes.length >= START_SHAPE_MAX) return;
    const id = `s${Date.now().toString(36)}`;
    setShapes([
      ...shapes,
      {
        id,
        kind,
        color: kind === "button" ? "#1f7a4a" : "#ffffff",
        width: START_SHAPE_DEFAULT_WIDTH[kind],
        opacity: 100,
        label: kind === "button" ? "くわしく見る" : "",
        href: "",
      },
    ]);
    setPickingShape(false);
    if (momentScreen) setMomentSelected(`shape:${id}`);
    else setSelected(`shape:${id}`);
  }
  const selectedShapeKey = momentScreen ? momentSelected : selected;
  const selectedShape =
    selectedShapeKey && selectedShapeKey.startsWith("shape:")
      ? (shapes.find((item) => `shape:${item.id}` === selectedShapeKey) ?? null)
      : null;
  // 背景を選んでいて、入れた背景（画像・動画・色）があるときだけ × を出す。
  const bgSelected = momentScreen ? momentSelected === "background" : view === "start" && selected === "background";
  const hasCustomBg = momentScreen
    ? Boolean(momentLayout.bgImageUrl || momentLayout.bgVideoUrl || momentLayout.bgTheme)
    : Boolean(
        experience.screens.start.imageUrl || experience.screens.start.videoUrl || experience.screens.start.look.bgTheme,
      );
  function clearBackground() {
    if (!edit) return;
    if (momentScreen) {
      edit.moment.onLayout(momentScreen, { ...momentLayout, bgImageUrl: "", bgVideoUrl: "", bgTheme: "" });
    } else {
      edit.onClearStartMedia();
      edit.onLook({ ...experience.screens.start.look, bgTheme: "" });
    }
  }

  function closeSelection() {
    setSelected(null);
    setMomentSelected(null);
  }

  function addText() {
    if (!edit || texts.length >= START_TEXT_MAX) return;
    const id = `t${Date.now().toString(36)}`;
    setTexts([
      ...texts,
      {
        id,
        text: "",
        size: "m",
        bold: false,
        color: momentScreen ? momentLayout.textColor : experience.screens.start.look.textColor,
      },
    ]);
    if (momentScreen) setMomentSelected(`extra:${id}`);
    else setSelected(`extra:${id}`);
    // 追加した入力欄に、そのまま文字を打てるようにする。
    window.setTimeout(() => {
      const fields = stageRef.current?.querySelectorAll<HTMLTextAreaElement>('textarea[aria-label="追加したテキスト"]');
      fields?.[fields.length - 1]?.focus();
    }, 60);
  }
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
  const settings = useMemo(() => ({ experience: { ...experience, spots } }), [experience, spots]);
  const start: PlayStart = useMemo(() => {
    const base = publicPlayStart(settings);
    return { ...base, configured: true, periodLabel: base.showPeriod ? periodLabel : null };
  }, [settings, periodLabel]);
  const moment = useMemo(() => publicPlayMoment(settings, null), [settings]);
  const title = start.title.trim() || name.trim();

  // 見本の進み具合。スタンプGETは途中、特典は全部集めたところを見せる。
  const progress: PlayProgress = useMemo(() => {
    const visible = spots.filter((spot) => spot.published);
    const all = view === "reward";
    // 途中の見本は「半分くらい集めたところ」。スタンプGETは最低1つ、ホームとマップは全部にはしない。
    const half =
      view === "stamp"
        ? Math.max(1, Math.ceil(visible.length / 2))
        : visible.length > 1
          ? Math.ceil(visible.length / 2)
          : 0;
    const rows = visible.map((spot, index) => ({
      id: spot.key,
      name: spot.name.trim() || `スポット ${index + 1}`,
      kind: spot.kind,
      kindLabel: ORGANIZER_GAME_SPOT_KIND_LABEL[spot.kind],
      stamped: all || index < half,
      imageUrl: spot.imageUrl,
      description: spot.description,
      hint: spot.hint,
      checkin: spot.checkin,
      lat: spot.lat,
      lng: spot.lng,
      videoUrl: spot.videoUrl,
      icon: spot.icon,
      mapStyle: spot.mapStyle,
      mapImageUrl: spot.mapImageUrl,
      stampImageUrl: spot.stampImageUrl,
    }));
    const stampedCount = rows.filter((row) => row.stamped).length;
    return {
      nickname: "プレビュー",
      stampedCount,
      spotCount: rows.length,
      completed: rows.length > 0 && stampedCount >= rows.length,
      ordered: experience.basics.route !== "free",
      stampImageUrl: experience.screens.stamp.imageUrl || undefined,
      rewardCode: all && experience.reward.kind === "coupon" ? "MG-0000" : undefined,
      rewardPoints: all && experience.reward.kind === "points" ? experience.reward.points : undefined,
      rewardBadge: all && experience.reward.kind === "badge" ? experience.reward.label : undefined,
      rewardBadgeImage: experience.reward.imageUrl || undefined,
      spots: rows,
    };
  }, [spots, view, experience]);

  const lastStamped = [...progress.spots].reverse().find((spot) => spot.stamped);
  const stampEvent: RallyStampEvent | null =
    view === "stamp" && lastStamped ? { spotId: lastStamped.id, name: lastStamped.name, already: false } : null;
  const tab: RallyTab = view === "map" ? "map" : view === "reward" ? "reward" : "home";

  return (
    <div className={cn("wizard-preview", className)}>
      <div className="wizard-preview__views" role="tablist" aria-label="プレビューする画面">
        {VIEWS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={view === item.id}
            onClick={() => {
              onView(item.id);
              setNonce((count) => count + 1);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      {edit && (view === "stamp" || view === "reward") ? (
        <p className="wizard-preview__edit-hint">タップで編集、押したままドラッグで移動</p>
      ) : null}
      {edit && view === "start" ? (
        <p className="wizard-preview__edit-hint">タップで編集、押したままドラッグで移動</p>
      ) : null}
      <div className="wizard-preview__zoom">
        <span>{actual ? "実寸（100%）" : `実寸の${Math.round(scale * 100)}%`}</span>
        <button type="button" onClick={() => setActual((current) => !current)}>
          {actual ? "画面に合わせる" : "実寸で見る"}
        </button>
      </div>
      <div ref={stageRef} className={cn("wizard-preview__stage", actual && "is-actual")}>
        <div className="wizard-preview__fit" style={{ width: PHONE_W * scale, height: PHONE_H * scale }}>
            {edit && bgSelected && hasCustomBg ? (
              <button
                type="button"
                className="wizard-preview__bg-delete"
                onClick={clearBackground}
                aria-label="入れた背景を消す"
                title="入れた背景を消す"
              >
                <X aria-hidden />
                背景を消す
              </button>
            ) : null}
            {edit && (view === "start" || momentScreen) ? (
              <div className="wizard-preview__adds">
                <button
                  type="button"
                  className="wizard-preview__add"
                  onClick={addText}
                  disabled={texts.length >= START_TEXT_MAX}
                >
                  <Plus aria-hidden />
                  テキスト
                </button>
                <button
                  type="button"
                  className="wizard-preview__add"
                  onClick={() => {
                    setSelected(null);
                    setMomentSelected(null);
                    setPickingShape(false);
                    setPicking(true);
                  }}
                  disabled={images.length >= START_IMAGE_MAX}
                >
                  <ImagePlus aria-hidden />
                  画像
                </button>
                <button
                  type="button"
                  className="wizard-preview__add"
                  onClick={() => {
                    closeSelection();
                    setPicking(false);
                    setPickingShape(true);
                  }}
                  disabled={shapes.length >= START_SHAPE_MAX}
                >
                  <Shapes aria-hidden />
                  図形
                </button>
                <button
                  type="button"
                  className="wizard-preview__add"
                  onClick={() => {
                    setPicking(false);
                    setPickingShape(false);
                    if (momentScreen) setMomentSelected("background");
                    else setSelected("background");
                  }}
                >
                  <Wallpaper aria-hidden />
                  背景
                </button>
              </div>
            ) : null}
          <div
            className="wizard-preview__phone"
            style={{ width: PHONE_W, height: PHONE_H, padding: BEZEL, transform: `scale(${scale})` }}
          >
            <div
              className="wizard-preview__screen"
              style={{ ["--preview-scale" as string]: String(scale) }}
            >
              {view === "start" ? (
                <RallyStartScreen
                  start={start}
                  title={title}
                  fallbackDescription=""
                  showLogin={false}
                  loginHref="#"
                  shareNote={null}
                  onShare={() => undefined}
                  onStart={() => onView("home")}
                  preview
                  edit={startEdit}
                />
              ) : (
                <RallyApp
                  key={`${view}-${nonce}`}
                  initialTab={tab}
                  favoritesKey="mg-play-fav:wizard-preview"
                  title={title || "タイトル未入力"}
                  heroImageUrl={start.imageUrl}
                  progress={progress}
                  moment={moment}
                  stampEvent={stampEvent}
                  onStampEventSeen={() => onView("home")}
                  claimHref="#"
                  loginHref="#"
                  showLogin={false}
                  replaying={false}
                  replayError={null}
                  onReplay={() => undefined}
                  momentEdit={momentEdit}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      {edit && view === "start" && selected && !picking && !selectedShape ? (
        <div className="wizard-preview__toolbar" data-place={panelPlace}>
          <StartEditPanel
            selection={selected}
            look={experience.screens.start.look}
            onLook={edit.onLook}
            texts={texts}
            onTextsChange={edit.onTextsChange}
            images={images}
            onImagesChange={edit.onImagesChange}
            media={edit.media}
            onClose={() => setSelected(null)}
            onResetPosition={(key) => moveTo(key, null)}
            onResetAllPositions={() => edit.onLook({ ...look, offsets: {} })}
            movedKeys={Object.keys(look.offsets ?? {})}
            showCharacter={experience.screens.start.showCharacter}
            onShowCharacter={edit.onShowCharacter}
          />
        </div>
      ) : null}
      {edit && momentEdit && momentScreen && momentSelected && !picking && !selectedShape ? (
        <div className="wizard-preview__toolbar" data-place={momentPlace}>
          <MomentEditPanel
            screen={momentScreen}
            selection={momentSelected}
            layout={momentLayout}
            onLayout={(layout) => edit.moment.onLayout(momentScreen, layout)}
            animation={experience.screens.stamp.animation}
            sound={experience.screens.stamp.sound}
            onStamp={edit.moment.onStamp}
            stampImageField={edit.moment.stampImageField}
            rewardKind={experience.reward.kind}
            onRewardKind={edit.moment.onRewardKind}
            rewardImageField={edit.moment.rewardImageField}
            bgImageField={edit.moment.bgImageField(momentScreen)}
            onClose={() => setMomentSelected(null)}
          />
        </div>
      ) : null}
      {edit && selectedShape && !picking && !pickingShape ? (
        <div className="wizard-preview__toolbar" data-place={momentScreen ? momentPlace : panelPlace}>
          <ShapeEditPanel
            key={selectedShape.id}
            shape={selectedShape}
            onChange={(patch) =>
              setShapes(shapes.map((item) => (item.id === selectedShape.id ? { ...item, ...patch } : item)))
            }
            onDelete={() => {
              setShapes(shapes.filter((item) => item.id !== selectedShape.id));
              closeSelection();
            }}
            onClose={closeSelection}
          />
        </div>
      ) : null}
      {edit && pickingShape ? (
        <div className="wizard-preview__toolbar" data-place="bottom">
          <ShapePicker onPick={addShape} onClose={() => setPickingShape(false)} />
        </div>
      ) : null}
      {edit && picking ? (
        // 画像は画面の上のほうに入るので、選ぶ欄は下に出す。設定と同じく半透明で浮かせる。
        <div className="wizard-preview__toolbar" data-place="bottom">
          <StartImagePicker
            onPick={addImage}
            onClose={() => setPicking(false)}
            uploadField={edit.uploadField((url) => addImage(url, "l"))}
          />
        </div>
      ) : null}
      <p className="wizard-preview__note">
        入力した文章や画像は、すぐここに反映されます。スタンプの数は見本です。
      </p>
    </div>
  );
}
