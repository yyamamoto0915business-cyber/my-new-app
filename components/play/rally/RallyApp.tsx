"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Footprints,
  Gift,
  Heart,
  House,
  Lightbulb,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Navigation,
  Plus,
  QrCode,
  RotateCcw,
  ScanLine,
  Share2,
  Stamp,
  UserRound,
  X,
} from "lucide-react";
import { PlayExitLink, PlayLocaleToggle } from "@/components/play/PlayLocaleSwitch";
import {
  Extras,
  RallyClearScreen,
  RallyStampGetScreen,
  cardStyle,
  isPart,
  layoutActions,
  moveKeyOf,
  selectable,
  shadeClass,
  type RallyMomentEdit,
} from "@/components/play/rally/RallyMomentScreens";
import { useMoveLayer } from "@/components/play/rally/useMoveLayer";
import { usePlayCopy } from "@/components/play/usePlayCopy";
import { useQrCamera } from "@/hooks/use-qr-camera";
import { parseCheckinQr } from "@/lib/checkin/parse-checkin-qr";
import {
  createScreenLayout,
  type GameSpotCategory,
  type PublicPlayMoment,
} from "@/lib/organizer/game-experience";
import type { PlayProgress, PlaySpotProgress } from "@/lib/organizer/play-types";
import type { RallyStampEvent, RallyTab } from "@/components/play/rally/types";
import { SPOT_CATEGORY_LOOK, SpotCategoryTag, spotCategory, spotIconUrl } from "@/components/play/rally/spotCategory";
import "./rally.css";

const RallyVectorMap = dynamic(
  () => import("@/components/play/rally/RallyVectorMap").then((mod) => mod.RallyVectorMap),
  { ssr: false, loading: () => <div className="rally-map__canvas" /> },
);

const RallyMap = dynamic(() => import("@/components/play/rally/RallyMap").then((mod) => mod.RallyMap), {
  ssr: false,
  loading: () => <div className="rally-map__canvas" />,
});

type Here = { lat: number; lng: number };

type MapFilter = "all" | "open" | "done" | "near" | `cat:${GameSpotCategory}`;

function distanceM(a: Here, b: { lat: number; lng: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

function spotDistance(spot: PlaySpotProgress, here: Here | null): number | null {
  if (!here || spot.lat == null || spot.lng == null) return null;
  return distanceM(here, { lat: spot.lat, lng: spot.lng });
}

/** つぎに巡るスポット。順番があればその先頭、なければ近い未獲得、なければ並びの先頭。 */
function pickNextSpot(progress: PlayProgress, here: Here | null): PlaySpotProgress | null {
  if (progress.completed) return null;
  if (progress.nextSpotId) {
    const fixed = progress.spots.find((spot) => spot.id === progress.nextSpotId);
    if (fixed) return fixed;
  }
  const open = progress.spots.filter((spot) => !spot.stamped);
  if (open.length === 0) return null;
  if (progress.ordered) return open[0];
  if (here) {
    const ranked = open
      .map((spot) => ({ spot, d: spotDistance(spot, here) }))
      .filter((row): row is { spot: PlaySpotProgress; d: number } => row.d != null)
      .sort((a, b) => a.d - b.d);
    if (ranked.length > 0) return ranked[0].spot;
  }
  return open[0];
}

function StampFace({ spot, stampImageUrl }: { spot: PlaySpotProgress; stampImageUrl?: string }) {
  if (!spot.stamped) return <span className="rally-seal__unknown">?</span>;
  if (spot.stampImageUrl) return <img className="rally-seal__mark" src={spot.stampImageUrl} alt="" />;
  if (spot.imageUrl) return <img src={spot.imageUrl} alt="" />;
  if (stampImageUrl) return <img className="rally-seal__mark" src={stampImageUrl} alt="" />;
  return <Stamp className="rally-seal__icon" aria-hidden />;
}

/**
 * 現在地。マップを開いているあいだ（または一度でも位置ボタンを押したあと）は追い続ける。
 * 許可がなければ failed になり、地図はスポットだけで使える。
 */
function useHere(watchWanted: boolean) {
  const [here, setHere] = useState<Here | null>(null);
  const [locating, setLocating] = useState(false);
  const [failed, setFailed] = useState(false);
  const [asked, setAsked] = useState(false);
  const watching = watchWanted || asked;

  useEffect(() => {
    if (!watching) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setFailed(true);
      return;
    }
    setLocating(true);
    setFailed(false);
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setHere({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        setFailed(false);
      },
      () => {
        setFailed(true);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [watching]);

  const locate = useCallback(() => setAsked(true), []);
  return { here, locating, failed, locate };
}

/** 主催者のプレビューで、マップ・リストからスポットを足したり直したりする。 */
export type RallySpotEdit = {
  /** なければ（上限に達したなど）追加ボタンを出さない。 */
  onAdd?: () => void;
  onEdit: (spotId: string) => void;
};

export function RallyApp({
  title,
  heroImageUrl,
  progress,
  moment,
  stampEvent,
  onStampEventSeen,
  claimHref,
  loginHref,
  showLogin,
  replaying,
  replayError,
  onReplay,
  favoritesKey,
  initialTab = "home",
  momentEdit,
  spotEdit,
}: {
  /** 渡すと、マップ・リストからスポットを追加・編集できる（主催者のプレビュー）。 */
  spotEdit?: RallySpotEdit;
  /** 渡すと、スタンプGETと特典の画面を直接編集できる（主催者のプレビュー）。 */
  momentEdit?: RallyMomentEdit;
  /** 最初に開くタブ（主催者のプレビュー用）。 */
  initialTab?: RallyTab;
  /** お気に入りを端末に残すキー。ゲームごとに分ける。 */
  favoritesKey: string;
  title: string;
  heroImageUrl: string;
  progress: PlayProgress;
  moment: PublicPlayMoment | null;
  stampEvent: RallyStampEvent | null;
  onStampEventSeen: () => void;
  claimHref: string;
  loginHref: string;
  showLogin: boolean;
  replaying: boolean;
  replayError: string | null;
  onReplay: () => void;
}) {
  const copy = usePlayCopy();
  const [tab, setTab] = useState<RallyTab>(initialTab);
  const [sheetSpotId, setSheetSpotId] = useState<string | null>(null);
  const [mapSpotId, setMapSpotId] = useState<string | null>(null);
  const { here, locating, failed, locate } = useHere(tab === "map");
  const favorites = useFavorites(favoritesKey);

  const nextSpot = useMemo(() => pickNextSpot(progress, here), [progress, here]);
  const sheetSpot = sheetSpotId ? (progress.spots.find((spot) => spot.id === sheetSpotId) ?? null) : null;

  const openOnMap = useCallback((spotId: string | null) => {
    setSheetSpotId(null);
    setMapSpotId(spotId);
    setTab("map");
  }, []);

  function goTab(next: RallyTab) {
    setSheetSpotId(null);
    setTab(next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }

  return (
    <div className={`rally-app rally-app--${tab}`}>
      {tab === "home" ? (
        <RallyHome
          title={title}
          progress={progress}
          nextSpot={nextSpot}
          here={here}
          onOpenSpot={setSheetSpotId}
          onOpenMap={openOnMap}
          moment={moment}
          edit={momentEdit}
        />
      ) : null}
      {tab === "map" ? (
        <RallySpots
          progress={progress}
          selectedId={mapSpotId}
          onSelect={setMapSpotId}
          onOpenSpot={spotEdit ? spotEdit.onEdit : setSheetSpotId}
          onAddSpot={spotEdit?.onAdd}
          editing={spotEdit != null}
          here={here}
          locating={locating}
          locateFailed={failed}
          onLocate={locate}
        />
      ) : null}
      {tab === "scan" ? <RallyScan title={title} /> : null}
      {tab === "reward" ? (
        <RallyReward
          title={title}
          heroImageUrl={heroImageUrl}
          progress={progress}
          moment={moment}
          claimHref={claimHref}
          edit={momentEdit}
        />
      ) : null}
      {tab === "me" ? (
        <RallyMe
          title={title}
          progress={progress}
          loginHref={loginHref}
          showLogin={showLogin}
          replaying={replaying}
          replayError={replayError}
          onReplay={onReplay}
        />
      ) : null}

      <nav className="rally-tabs" aria-label={title}>
        <TabButton current={tab} id="home" label={copy.rally.tabHome} onPick={goTab} icon={<House aria-hidden />} />
        <TabButton current={tab} id="map" label={copy.rally.tabMap} onPick={goTab} icon={<MapIcon aria-hidden />} />
        <button
          type="button"
          className={tab === "scan" ? "rally-tabs__scan is-current" : "rally-tabs__scan"}
          aria-current={tab === "scan" ? "page" : undefined}
          onClick={() => goTab("scan")}
        >
          <span aria-hidden>
            <ScanLine />
          </span>
          {copy.rally.tabScan}
        </button>
        <TabButton
          current={tab}
          id="reward"
          label={copy.rally.tabReward}
          onPick={goTab}
          icon={<Gift aria-hidden />}
          dot={progress.completed}
        />
        <TabButton current={tab} id="me" label={copy.rally.tabMe} onPick={goTab} icon={<UserRound aria-hidden />} />
      </nav>

      {sheetSpot ? (
        <RallySpotSheet
          key={sheetSpot.id}
          spot={sheetSpot}
          spots={progress.spots}
          here={here}
          favorite={favorites.ids.includes(sheetSpot.id)}
          onToggleFavorite={() => favorites.toggle(sheetSpot.id)}
          onClose={() => setSheetSpotId(null)}
          onScan={() => goTab("scan")}
          onMap={() => openOnMap(sheetSpot.id)}
          onOpenSpot={setSheetSpotId}
        />
      ) : null}

      {stampEvent ? (
        <RallyStampGetScreen
          event={stampEvent}
          progress={progress}
          moment={moment}
          heroImageUrl={heroImageUrl}
          edit={momentEdit}
          onBook={() => {
            onStampEventSeen();
            goTab("home");
          }}
          onNext={() => {
            onStampEventSeen();
            openOnMap(pickNextSpot(progress, here)?.id ?? null);
          }}
          onReward={() => {
            onStampEventSeen();
            goTab("reward");
          }}
        />
      ) : null}
    </div>
  );
}

function TabButton({
  current,
  id,
  label,
  icon,
  dot,
  onPick,
}: {
  current: RallyTab;
  id: RallyTab;
  label: string;
  icon: ReactNode;
  dot?: boolean;
  onPick: (tab: RallyTab) => void;
}) {
  return (
    <button
      type="button"
      className={current === id ? "rally-tabs__btn is-current" : "rally-tabs__btn"}
      aria-current={current === id ? "page" : undefined}
      onClick={() => onPick(id)}
    >
      <span className="rally-tabs__icon">
        {icon}
        {dot ? <span className="rally-tabs__dot" aria-hidden /> : null}
      </span>
      {label}
    </button>
  );
}

function ProgressMeter({
  progress,
  label,
  className,
  style,
  onClick,
}: {
  progress: PlayProgress;
  /** 「スタンプ獲得状況」の文字（入力欄にするときは ReactNode を渡す）。 */
  label?: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: (event: { stopPropagation: () => void; target: EventTarget }) => void;
}) {
  const copy = usePlayCopy();
  const total = progress.spotCount;
  const done = progress.stampedCount;
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  const left = Math.max(0, total - done);
  return (
    <div className={["rally-meter", className].filter(Boolean).join(" ")} style={style} onClick={onClick}>
      <div className="rally-meter__row">
        <span className="rally-meter__label">{label ?? copy.rally.stampStatus}</span>
        <span className="rally-meter__count">
          <strong>{done}</strong> / {total}
        </span>
      </div>
      <div
        className="rally-meter__bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-label={copy.rally.progressLabel}
      >
        <span style={{ width: `${pct}%` }} />
      </div>
      <p className="rally-meter__left">
        {progress.completed ? copy.rally.allDone : total > 0 ? copy.rallyLeft(left) : copy.spotsSoon}
      </p>
    </div>
  );
}

function RallyHome({
  title,
  progress,
  nextSpot,
  here,
  onOpenSpot,
  onOpenMap,
  moment,
  edit,
}: {
  title: string;
  progress: PlayProgress;
  nextSpot: PlaySpotProgress | null;
  here: Here | null;
  onOpenSpot: (spotId: string) => void;
  onOpenMap: (spotId: string | null) => void;
  moment: PublicPlayMoment | null;
  /** 主催者のプレビューで、ホームを直接編集する。 */
  edit?: RallyMomentEdit;
}) {
  const copy = usePlayCopy();
  const rootRef = useRef<HTMLElement>(null);
  const layout = moment?.homeLayout ?? createScreenLayout();
  const actions = edit ? layoutActions("home", layout, edit) : undefined;
  const layer = useMoveLayer({
    containerRef: rootRef,
    offsets: layout.offsets,
    activeKey: moveKeyOf(edit?.selected ?? null),
    edit: actions,
  });
  const shown = (key: string) => !layout.hidden.includes(key);
  const labels = layout.labels ?? {};
  const nextDistance = nextSpot ? spotDistance(nextSpot, here) : null;
  const saveLabel = (key: string, value: string) =>
    edit?.onLayout("home", { ...layout, labels: { ...labels, [key]: value } });

  /** 見出し。編集中は入力欄にする（空なら、もとの文字に戻る）。 */
  const heading = (key: "bookTitle" | "nextTitle", fallback: string) =>
    layer.movable(
      key,
      edit ? (
        <input
          className={`rally-section__title rally-edit${edit.selected === key ? " is-selected" : ""}`}
          value={labels[key] ?? ""}
          placeholder={fallback}
          maxLength={30}
          aria-label={`${fallback}の見出し`}
          onFocus={() => edit.onSelect(key)}
          onChange={(event) => saveLabel(key, event.target.value)}
        />
      ) : (
        <h2 className="rally-section__title">{labels[key] || fallback}</h2>
      ),
    );

  const meterLabel = edit ? (
    <input
      className="rally-meter__label rally-edit"
      value={labels.meterLabel ?? ""}
      placeholder={copy.rally.stampStatus}
      maxLength={30}
      aria-label="スタンプ獲得状況の見出し"
      onFocus={() => edit.onSelect("meter")}
      onChange={(event) => saveLabel("meterLabel", event.target.value)}
    />
  ) : (
    labels.meterLabel || undefined
  );

  return (
    <main
      ref={rootRef}
      className={[
        "rally-page rally-home rally-layer",
        shadeClass(layout),
        layout.bgTheme ? "has-theme" : "",
        edit ? "is-editing" : "",
        edit?.selected === "background" ? "is-bg-selected" : "",
        layer.dragging ? "is-dragging" : "",
        layer.guide ? "is-guide" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={layout.titleColor ? ({ ["--home-title" as string]: layout.titleColor } as CSSProperties) : undefined}
      onClick={
        edit
          ? (event) => {
              if (layer.justGestured()) return;
              const target = event.target as HTMLElement;
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
          poster={layout.bgImageUrl || undefined}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        />
      ) : layout.bgImageUrl ? (
        <img className="rally-layer__bg" src={layout.bgImageUrl} alt="" aria-hidden />
      ) : null}
      <header className="rally-bar">
        <PlayExitLink className="rally-bar__exit" />
        <h1>{title}</h1>
      </header>
      {shown("meter")
        ? layer.movable(
            "meter",
            <ProgressMeter
              progress={progress}
              label={meterLabel}
              className={`rally-card-colors${edit ? " is-editable" : ""}`}
              style={cardStyle(layout)}
              onClick={selectable(edit, "meter").onClick}
            />,
          )
        : null}

      <section className="rally-section">
        {shown("bookTitle") ? heading("bookTitle", copy.rally.stampBook) : null}
        {layer.movable(
          "book",
          <ol
            className={`rally-book rally-card-colors${edit ? " is-editable" : ""}`}
            style={cardStyle(layout)}
            {...selectable(edit, "book")}
          >
            {progress.spots.map((spot) => {
              const isNext = nextSpot?.id === spot.id;
              return (
                <li key={spot.id}>
                  <button
                    type="button"
                    className={[
                      "rally-seal",
                      spot.stamped ? "is-stamped" : "",
                      isNext ? "is-next" : "",
                      edit ? "is-editable" : "",
                      edit?.selected === `spotSeal:${spot.id}` ? "is-selected" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={
                      edit
                        ? (event) => {
                            // 主催者は、押したスタンプの絵をここで変えられる。
                            event.stopPropagation();
                            edit.onSelect(`spotSeal:${spot.id}`);
                          }
                        : () => onOpenSpot(spot.id)
                    }
                    aria-label={spot.stamped ? `${spot.name}（${copy.rally.stamped}）` : spot.name}
                  >
                    <span className="rally-seal__face">
                      <StampFace spot={spot} stampImageUrl={progress.stampImageUrl} />
                    </span>
                    {spot.stamped ? (
                      <span className="rally-seal__check" aria-hidden>
                        <Check />
                      </span>
                    ) : null}
                    <span className="rally-seal__name">{spot.stamped || isNext ? spot.name : " "}</span>
                  </button>
                </li>
              );
            })}
          </ol>,
        )}
      </section>

      <Extras layout={layout} layer={layer} edit={edit} actions={actions} />

      {nextSpot && (shown("nextTitle") || shown("next")) ? (
        <section className="rally-section">
          {shown("nextTitle") ? heading("nextTitle", copy.rally.nextPick) : null}
          {shown("next")
            ? layer.movable(
                "next",
                <div
                  className={`rally-next rally-card-colors${edit ? " is-editable" : ""}`}
                  style={cardStyle(layout)}
                  {...selectable(edit, "next")}
                >
                  <button
                    type="button"
                    className="rally-next__body"
                    onClick={edit ? undefined : () => onOpenSpot(nextSpot.id)}
                    tabIndex={edit ? -1 : undefined}
                  >
                    <span className="rally-next__thumb" aria-hidden>
                      {nextSpot.imageUrl ? <img src={nextSpot.imageUrl} alt="" /> : <MapPin />}
                    </span>
                    <span className="rally-next__text">
                      <strong>{nextSpot.name}</strong>
                      {nextSpot.description ? <span>{nextSpot.description}</span> : null}
                      {nextDistance != null ? <em>{copy.rallyDistance(nextDistance)}</em> : null}
                    </span>
                    <ChevronRight className="rally-next__chev" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="rally-cta rally-cta--small"
                    onClick={edit ? undefined : () => onOpenMap(nextSpot.id)}
                    tabIndex={edit ? -1 : undefined}
                  >
                    {copy.rally.seeOnMap}
                    <ArrowRight aria-hidden />
                  </button>
                </div>,
              )
            : null}
        </section>
      ) : null}
    </main>
  );
}

function RallySpots({
  progress,
  selectedId,
  onSelect,
  onOpenSpot,
  onAddSpot,
  editing,
  here,
  locating,
  locateFailed,
  onLocate,
}: {
  progress: PlayProgress;
  selectedId: string | null;
  onSelect: (spotId: string | null) => void;
  onOpenSpot: (spotId: string) => void;
  onAddSpot?: () => void;
  /** 主催者のプレビュー。スポットを開くと編集になる。 */
  editing: boolean;
  here: Here | null;
  locating: boolean;
  locateFailed: boolean;
  onLocate: () => void;
}) {
  const copy = usePlayCopy();
  const [view, setView] = useState<"map" | "list">("map");
  const [filter, setFilter] = useState<MapFilter>("all");
  const [flatMap, setFlatMap] = useState(false);
  /** 位置ボタンを押した回数。地図はこれが増えるたびに現在地へ移動する。 */
  const [recenter, setRecenter] = useState(0);

  // 種類が2つ以上あるときだけ、種類の絞り込みを出す。
  const categories = useMemo(() => {
    const seen = new Set<GameSpotCategory>();
    progress.spots.forEach((spot) => seen.add(spotCategory(spot)));
    return seen.size > 1 ? [...seen] : [];
  }, [progress.spots]);

  const shown = useMemo(() => {
    const rows = progress.spots.filter((spot) => {
      if (filter === "open") return !spot.stamped;
      if (filter === "done") return spot.stamped;
      if (filter.startsWith("cat:")) return spotCategory(spot) === filter.slice(4);
      return true;
    });
    if (filter !== "near" || !here) return rows;
    return [...rows].sort((a, b) => (spotDistance(a, here) ?? Infinity) - (spotDistance(b, here) ?? Infinity));
  }, [progress.spots, filter, here]);

  const pinned = shown.filter((spot) => spot.lat != null && spot.lng != null);
  const selected = selectedId ? (progress.spots.find((spot) => spot.id === selectedId) ?? null) : null;

  function pickFilter(next: MapFilter) {
    setFilter(next);
    if (next === "near" && !here) onLocate();
  }

  const filters: { id: MapFilter; label: string }[] = [
    { id: "all", label: copy.rally.filterAll },
    ...categories.map((category) => ({ id: `cat:${category}` as MapFilter, label: copy.spotCategoryShort(category) })),
    { id: "open", label: copy.rally.filterOpen },
    { id: "done", label: copy.rally.filterDone },
    { id: "near", label: copy.rally.filterNear },
  ];

  return (
    <main className={view === "map" ? "rally-spots rally-spots--map" : "rally-spots"}>
      <div className="rally-spots__head">
        <div className="rally-spots__top">
          <PlayExitLink />
          <div className="rally-segment" role="tablist">
            <button type="button" role="tab" aria-selected={view === "map"} onClick={() => setView("map")}>
              {copy.rally.map}
            </button>
            <button type="button" role="tab" aria-selected={view === "list"} onClick={() => setView("list")}>
              {copy.rally.list}
            </button>
          </div>
        </div>
        <div className="rally-chips">
          {filters.map((item) => {
            const category = item.id.startsWith("cat:") ? (item.id.slice(4) as GameSpotCategory) : null;
            const look = category ? SPOT_CATEGORY_LOOK[category] : null;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={filter === item.id}
                onClick={() => pickFilter(item.id)}
                style={look && filter === item.id ? { background: look.color, borderColor: look.color } : undefined}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        {locating ? <p className="rally-spots__note">{copy.rally.locating}</p> : null}
        {locateFailed && filter === "near" && view === "list" ? (
          <p className="rally-spots__note">{copy.rally.locateFailed}</p>
        ) : null}
      </div>

      {view === "map" ? (
        <div className="rally-map">
          {flatMap ? (
            <RallyMap
              spots={pinned}
              selectedId={selectedId}
              here={here}
              onSelect={onSelect}
              label={copy.rally.map}
              route={progress.ordered === true && filter === "all"}
            />
          ) : (
            <RallyVectorMap
              spots={pinned}
              selectedId={selectedId}
              here={here}
              onSelect={onSelect}
              label={copy.rally.map}
              route={progress.ordered === true && filter === "all"}
              recenter={recenter}
              onUnavailable={() => setFlatMap(true)}
            />
          )}
          <button
            type="button"
            className={here ? "rally-map__locate is-on" : "rally-map__locate"}
            onClick={() => {
              onLocate();
              setRecenter((count) => count + 1);
            }}
            aria-label={copy.rally.myLocation}
          >
            <LocateFixed aria-hidden />
          </button>
          {locateFailed ? <p className="rally-map__notice">{copy.rally.locateFailed}</p> : null}
          {pinned.length === 0 ? <p className="rally-map__empty">{copy.rally.noPins}</p> : null}
          {onAddSpot && !selected ? (
            <button type="button" className="rally-spot-add rally-spot-add--float" onClick={onAddSpot}>
              <Plus aria-hidden />
              スポットを追加
            </button>
          ) : null}
          {selected ? (
            <MapSpotCard
              spot={selected}
              here={here}
              editing={editing}
              onOpen={() => onOpenSpot(selected.id)}
              onClose={() => onSelect(null)}
            />
          ) : null}
        </div>
      ) : (
        <ul className="rally-list">
          {shown.length === 0 ? <li className="rally-list__empty">{copy.rally.noSpots}</li> : null}
          {shown.map((spot) => (
            <li key={spot.id} className={editing ? "is-editable" : undefined}>
              <SpotRow spot={spot} here={here} onOpen={() => onOpenSpot(spot.id)} />
            </li>
          ))}
          {onAddSpot ? (
            <li className="rally-list__add">
              <button type="button" className="rally-spot-add" onClick={onAddSpot}>
                <Plus aria-hidden />
                スポットを追加
              </button>
            </li>
          ) : null}
        </ul>
      )}
    </main>
  );
}

function WalkLine({ meters }: { meters: number }) {
  const copy = usePlayCopy();
  return (
    <span className="rally-walk">
      <Footprints aria-hidden />
      {copy.rallyDistance(meters)}
      <span aria-hidden>·</span>
      {copy.walkMinutes(meters)}
    </span>
  );
}

function MapSpotCard({
  spot,
  here,
  editing,
  onOpen,
  onClose,
}: {
  spot: PlaySpotProgress;
  here: Here | null;
  editing: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const copy = usePlayCopy();
  const d = spotDistance(spot, here);
  const category = spotCategory(spot);
  return (
    <div className="rally-map__card">
      <button type="button" className="rally-map__close" onClick={onClose} aria-label={copy.rally.close}>
        <X aria-hidden />
      </button>
      <div className="rally-mapcard">
        <span className="rally-mapcard__thumb" aria-hidden>
          {spot.imageUrl ? <img src={spot.imageUrl} alt="" /> : <img className="is-art" src={spotIconUrl(spot)} alt="" />}
        </span>
        <div className="rally-mapcard__text">
          <strong>{spot.name}</strong>
          <span className="rally-mapcard__tags">
            <SpotCategoryTag category={category} label={copy.spotCategory(category)} />
            {spot.stamped ? <span className="rally-tag rally-tag--done">{copy.rally.stamped}</span> : null}
          </span>
          {d != null ? <WalkLine meters={d} /> : null}
          {spot.description ? <p>{spot.description}</p> : null}
        </div>
      </div>
      <button type="button" className="rally-cta rally-cta--small" onClick={onOpen}>
        {editing ? "このスポットを編集" : copy.rally.details}
        <ChevronRight aria-hidden />
      </button>
    </div>
  );
}

function SpotRow({ spot, here, onOpen }: { spot: PlaySpotProgress; here: Here | null; onOpen: () => void }) {
  const copy = usePlayCopy();
  const d = spotDistance(spot, here);
  const category = spotCategory(spot);
  return (
    <button type="button" className="rally-row" onClick={onOpen}>
      <span className="rally-row__thumb" aria-hidden>
        {spot.imageUrl ? <img src={spot.imageUrl} alt="" /> : <MapPin />}
      </span>
      <span className="rally-row__text">
        <strong>{spot.name}</strong>
        <span className="rally-mapcard__tags">
          <SpotCategoryTag category={category} label={copy.spotCategory(category)} />
        </span>
        {spot.description ? <span>{spot.description}</span> : null}
        {d != null ? <em>{copy.rallyDistance(d)}</em> : null}
      </span>
      {spot.stamped ? (
        <span className="rally-row__done" aria-label={copy.rally.stamped}>
          <Check aria-hidden />
        </span>
      ) : (
        <ChevronRight className="rally-row__chev" aria-hidden />
      )}
    </button>
  );
}

function useEscape(onClose: () => void) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
}

/** この端末で「お気に入り」にしたスポット。ゲームごとに保存する。 */
function useFavorites(storageKey: string) {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      setIds(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : []);
    } catch {
      setIds([]);
    }
  }, [storageKey]);
  const toggle = useCallback(
    (id: string) => {
      setIds((current) => {
        const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          /* 保存できなくても、その場の表示は切り替える */
        }
        return next;
      });
    },
    [storageKey],
  );
  return { ids, toggle };
}

function walkingDirectionsHref(spot: PlaySpotProgress): string | null {
  if (spot.lat == null || spot.lng == null) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${spot.lat},${spot.lng}`)}&travelmode=walking`;
}

function RallySpotSheet({
  spot,
  spots,
  here,
  favorite,
  onToggleFavorite,
  onClose,
  onScan,
  onMap,
  onOpenSpot,
}: {
  spot: PlaySpotProgress;
  spots: PlaySpotProgress[];
  here: Here | null;
  favorite: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
  onScan: () => void;
  onMap: () => void;
  onOpenSpot: (spotId: string) => void;
}) {
  const copy = usePlayCopy();
  useEscape(onClose);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const category = spotCategory(spot);
  const look = SPOT_CATEGORY_LOOK[category];
  const distance = spotDistance(spot, here);
  const method = spot.checkin ?? "qr";
  const methodLabel =
    method === "gps" ? copy.rally.checkinGps : method === "keyword" ? copy.rally.checkinKeyword : copy.rally.checkinQr;
  const methodNote =
    method === "gps"
      ? copy.rally.checkinGpsNote
      : method === "keyword"
        ? copy.rally.checkinKeywordNote
        : copy.rally.checkinQrNote;
  const hasPlace = spot.lat != null && spot.lng != null;
  const routeHref = walkingDirectionsHref(spot);

  // このスポットから近い順に、ほかのスポットを3つ。
  const related = useMemo(() => {
    if (spot.lat == null || spot.lng == null) return spots.filter((item) => item.id !== spot.id).slice(0, 3);
    const origin = { lat: spot.lat, lng: spot.lng };
    return spots
      .filter((item) => item.id !== spot.id)
      .map((item) => ({ item, d: spotDistance(item, origin) ?? Infinity }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 3)
      .map((row) => row.item);
  }, [spot, spots]);

  async function share() {
    const url = window.location.href.split("?")[0];
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: spot.name, text: spot.description || spot.name, url });
        return;
      }
      await navigator.clipboard.writeText(`${spot.name} ${url}`);
      setShareNote(copy.rally.copied);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setShareNote(copy.rally.shareFailed);
    }
  }

  return (
    <div className="rally-sheet" role="dialog" aria-modal="true" aria-label={spot.name}>
      <div className="rally-sheet__media">
        {spot.imageUrl ? <img src={spot.imageUrl} alt="" /> : <img className="rally-sheet__art" src={spotIconUrl(spot)} alt="" />}
        <button type="button" className="rally-sheet__back" onClick={onClose} aria-label={copy.rally.back}>
          <ChevronLeft aria-hidden />
        </button>
        <button
          type="button"
          className={favorite ? "rally-sheet__fav is-on" : "rally-sheet__fav"}
          onClick={onToggleFavorite}
          aria-pressed={favorite}
          aria-label={copy.rally.favorite}
        >
          <Heart aria-hidden />
        </button>
      </div>
      <div className="rally-sheet__body">
        <div className="rally-sheet__title">
          <span className="rally-sheet__icon" style={{ background: look.soft }} aria-hidden>
            <img src={spotIconUrl(spot)} alt="" />
          </span>
          <div>
            <h2>{spot.name}</h2>
            <span className="rally-mapcard__tags">
              <SpotCategoryTag category={category} label={copy.spotCategory(category)} />
              {spot.stamped ? (
                <span className="rally-tag rally-tag--done">
                  <Check aria-hidden />
                  {copy.rally.stamped}
                </span>
              ) : null}
            </span>
          </div>
        </div>
        {distance != null ? <WalkLine meters={distance} /> : null}
        {spot.description ? <p className="rally-sheet__desc">{spot.description}</p> : null}

        <div className="rally-actions">
          {hasPlace ? (
            <button type="button" onClick={onMap}>
              <MapPin aria-hidden />
              {copy.rally.seeOnMap}
            </button>
          ) : null}
          {routeHref ? (
            <a href={routeHref} target="_blank" rel="noopener noreferrer">
              <Navigation aria-hidden />
              {copy.rally.route}
            </a>
          ) : null}
          <button type="button" onClick={() => void share()}>
            <Share2 aria-hidden />
            {copy.share}
          </button>
        </div>
        {shareNote ? (
          <p className="rally-sheet__note" role="status">
            {shareNote}
          </p>
        ) : null}

        {spot.imageUrl || spot.videoUrl ? (
          <>
            <h3 className="rally-sheet__sub">{copy.rally.media}</h3>
            <div className="rally-media">
              {spot.imageUrl ? <img src={spot.imageUrl} alt={spot.name} /> : null}
              {spot.videoUrl ? <video src={spot.videoUrl} controls playsInline preload="metadata" /> : null}
            </div>
          </>
        ) : null}

        {spot.hint ? (
          <div className="rally-tip">
            <Lightbulb aria-hidden />
            <div>
              <strong>{copy.rally.hint}</strong>
              <p>{spot.hint}</p>
            </div>
          </div>
        ) : null}

        <h3 className="rally-sheet__sub">{copy.rally.checkinHow}</h3>
        <div className="rally-info">
          <span className="rally-info__icon" aria-hidden>
            {method === "gps" ? <LocateFixed /> : <Camera />}
          </span>
          <div>
            <strong>{methodLabel}</strong>
            <p>{methodNote}</p>
          </div>
        </div>

        {related.length > 0 ? (
          <>
            <h3 className="rally-sheet__sub">{copy.rally.related}</h3>
            <ul className="rally-related">
              {related.map((item) => {
                const away =
                  spot.lat != null && spot.lng != null ? spotDistance(item, { lat: spot.lat, lng: spot.lng }) : null;
                return (
                  <li key={item.id}>
                    <button type="button" onClick={() => onOpenSpot(item.id)}>
                      <span className="rally-related__thumb" aria-hidden>
                        {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <MapPin />}
                      </span>
                      <strong>{item.name}</strong>
                      {away != null ? (
                        <em>
                          <Footprints aria-hidden />
                          {copy.rallyDistance(away)}
                        </em>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}
      </div>
      {spot.stamped ? null : (
        <div className="rally-sheet__dock">
          <button type="button" className="rally-cta" onClick={onScan}>
            <Camera aria-hidden />
            {copy.rally.stampHere}
          </button>
        </div>
      )}
    </div>
  );
}

function RallyScan({ title }: { title: string }) {
  const copy = usePlayCopy();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [note, setNote] = useState<string | null>(null);

  const onCode = useCallback(
    (raw: string) => {
      const parsed = parseCheckinQr(raw);
      if (parsed?.type !== "play") {
        setNote(copy.rally.scanWrong);
        return false;
      }
      setNote(copy.rally.scanFound);
      router.push(parsed.path);
      return true;
    },
    [copy.rally.scanFound, copy.rally.scanWrong, router],
  );
  const { state } = useQrCamera(videoRef, onCode);
  const live = state === "starting" || state === "scanning";

  return (
    <main className="rally-page">
      <header className="rally-bar">
        <PlayExitLink className="rally-bar__exit" />
        <h1>{title}</h1>
      </header>
      {live ? (
        <div className="rally-camera">
          <video ref={videoRef} playsInline muted autoPlay />
          <div className="rally-camera__frame" aria-hidden>
            <span />
          </div>
          <p className="rally-camera__note" role="status">
            {state === "starting" ? copy.rally.scanStarting : (note ?? copy.rally.scanAim)}
          </p>
        </div>
      ) : null}
      {live ? null : (
        <div className="rally-scan">
          <div className="rally-scan__frame" aria-hidden>
            <span />
            <QrCode />
          </div>
          <h2>{copy.rally.scanTitle}</h2>
          <p className="rally-scan__why">
            {state === "denied" ? copy.rally.scanDenied : copy.rally.scanNoCamera}
          </p>
          <p>{copy.rally.scanLead}</p>
          <ol className="rally-scan__steps">
            <li>
              <span>1</span>
              {copy.rally.scanStep1}
            </li>
            <li>
              <span>2</span>
              {copy.rally.scanStep2}
            </li>
            <li>
              <span>3</span>
              {copy.rally.scanStep3}
            </li>
          </ol>
        </div>
      )}
    </main>
  );
}

function RallyReward({
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
  moment: PublicPlayMoment | null;
  claimHref: string;
  edit?: RallyMomentEdit;
}) {
  const copy = usePlayCopy();
  if (edit && moment) {
    return (
      <RallyClearScreen
        title={title}
        heroImageUrl={heroImageUrl}
        progress={progress}
        moment={moment}
        claimHref={claimHref}
        edit={edit}
      />
    );
  }
  if (!progress.completed) {
    return (
      <main className="rally-page">
        <header className="rally-bar">
          <PlayExitLink className="rally-bar__exit" />
          <h1>{copy.rally.rewardTitle}</h1>
        </header>
        <div className="rally-locked">
          <span className="rally-locked__icon" aria-hidden>
            <Gift />
          </span>
          {moment?.rewardLabel ? <p className="rally-locked__label">{moment.rewardLabel}</p> : null}
          <p>{copy.rally.rewardLocked}</p>
        </div>
        <ProgressMeter progress={progress} />
      </main>
    );
  }
  if (!moment) return null;
  return (
    <RallyClearScreen title={title} heroImageUrl={heroImageUrl} progress={progress} moment={moment} claimHref={claimHref} />
  );
}

function RallyMe({
  title,
  progress,
  loginHref,
  showLogin,
  replaying,
  replayError,
  onReplay,
}: {
  title: string;
  progress: PlayProgress;
  loginHref: string;
  showLogin: boolean;
  replaying: boolean;
  replayError: string | null;
  onReplay: () => void;
}) {
  const copy = usePlayCopy();
  return (
    <main className="rally-page">
      <header className="rally-bar">
        <PlayExitLink className="rally-bar__exit" />
        <h1>{copy.rally.tabMe}</h1>
      </header>
      <div className="rally-me">
        <div className="rally-me__card">
          <span className="rally-me__avatar" aria-hidden>
            <UserRound />
          </span>
          <div>
            <p className="rally-me__label">{copy.rally.playerName}</p>
            <p className="rally-me__name">{progress.nickname}</p>
            <p className="rally-me__game">{title}</p>
          </div>
        </div>
        <ProgressMeter progress={progress} />
        <div className="rally-me__row">
          <span>{copy.rally.language}</span>
          <PlayLocaleToggle />
        </div>
        {progress.canReplay ? (
          <button type="button" className="rally-ghost" disabled={replaying} onClick={onReplay}>
            <RotateCcw aria-hidden />
            {replaying ? copy.replaying : copy.replay}
          </button>
        ) : null}
        {replayError ? <p className="rally-me__error">{copy.msg(replayError)}</p> : null}
        {showLogin ? (
          <Link className="rally-ghost" href={loginHref}>
            {copy.login}
          </Link>
        ) : null}
      </div>
    </main>
  );
}

