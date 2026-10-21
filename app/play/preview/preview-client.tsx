"use client";

import { useMemo, useState } from "react";
import { RotateCcw, Stamp } from "lucide-react";
import { RallyApp } from "@/components/play/rally/RallyApp";
import { RallyStartScreen } from "@/components/play/rally/RallyStartScreen";
import type { PlayStart, RallyStampEvent } from "@/components/play/rally/types";
import { createScreenLayout, type PublicPlayMoment } from "@/lib/organizer/game-experience";
import type { PlayProgress, PlaySpotProgress } from "@/lib/organizer/play-types";

const START: PlayStart = {
  configured: true,
  title: "おまつりラリー",
  catchCopy: "まちを巡るスタンプラリー",
  description: "祭りの会場を巡って、\nひと回りしよう！",
  imageUrl: "/organizer/games/template-stamp.jpg",
  videoUrl: "",
  steps: [],
  buttonLabel: "ラリーをはじめる",
  showCharacter: false,
  showFreeBadge: true,
  showPeriod: true,
  showShare: false,
  periodLabel: "2026/7/12 〜 2026/7/20",
};

const MOMENT: PublicPlayMoment = {
  configured: true,
  intro: "",
  description: "",
  hint: "",
  imageUrl: "",
  videoUrl: "",
  stampMessage: "やったね！",
  stampAnimation: "confetti",
  stampImageUrl: "",
  stampSound: "none",
  stampSoundUrl: "",
  clearTitle: "",
  clearMessage: "受付で画面を見せてください。",
  rewardLabel: "ドリンク1杯無料",
  rewardKind: "coupon",
  showCharacter: false,
  stampLayout: createScreenLayout(),
  clearLayout: createScreenLayout(),
  homeLayout: createScreenLayout(),
  checkin: "qr",
  lat: null,
  lng: null,
  radiusM: null,
};

const SPOTS: Omit<PlaySpotProgress, "stamped">[] = (
  [
  { name: "入口の鳥居", image: "sakura", lat: 35.7101, lng: 139.8107, checkin: "qr", icon: "historic" },
  { name: "舞台前", image: "town", lat: 35.7112, lng: 139.8125, checkin: "qr", icon: "festival", mapStyle: "art" },
  { name: "屋台通り", image: "cafe", lat: 35.7093, lng: 139.8131, checkin: "keyword", icon: "event-hall" },
  { name: "神社", image: "river", lat: 35.7121, lng: 139.8098, checkin: "gps", icon: "shrine", mapStyle: "art" },
  { name: "グルメ広場", image: "walk", lat: 35.7085, lng: 139.8112, checkin: "qr", icon: "ramen", mapStyle: "photo" },
  { name: "記念の場所", image: "flower", lat: 35.7106, lng: 139.8145, checkin: "qr", icon: "viewpoint" },
  ] as const
).map((spot, index) => ({
  id: `preview-${index}`,
  name: spot.name,
  kind: "stamp" as const,
  kindLabel: "スタンプ",
  imageUrl: `/profile/album/spring/${spot.image}.jpg`,
  description: "祭りのメインステージです。伝統芸能やダンスパフォーマンスが楽しめます。",
  hint: "大きなやぐらが目印です。",
  checkin: spot.checkin,
  icon: spot.icon,
  mapStyle: "mapStyle" in spot ? spot.mapStyle : "marker",
  lat: spot.lat,
  lng: spot.lng,
}));

function buildProgress(stamped: string[]): PlayProgress {
  const spots = SPOTS.map((spot) => ({ ...spot, stamped: stamped.includes(spot.id) }));
  const completed = stamped.length >= spots.length;
  return {
    nickname: "プレビュー",
    stampedCount: stamped.length,
    spotCount: spots.length,
    completed,
    ordered: false,
    canReplay: false,
    rewardCode: completed ? "MG-4821" : undefined,
    spots,
  };
}

export function RallyPreviewClient() {
  const [joined, setJoined] = useState(false);
  const [stamped, setStamped] = useState<string[]>(["preview-0", "preview-1"]);
  const [event, setEvent] = useState<RallyStampEvent | null>(null);
  const progress = useMemo(() => buildProgress(stamped), [stamped]);

  function stampNext() {
    const next = SPOTS.find((spot) => !stamped.includes(spot.id));
    if (!next) return;
    setStamped((current) => [...current, next.id]);
    setEvent({ spotId: next.id, name: next.name, already: false });
  }

  function reset() {
    setStamped([]);
    setEvent(null);
    setJoined(false);
  }

  if (!joined) {
    return (
      <RallyStartScreen
        start={START}
        title={START.title}
        fallbackDescription=""
        showLogin={false}
        loginHref="/auth"
        shareNote={null}
        onShare={() => undefined}
        onStart={() => setJoined(true)}
      />
    );
  }

  return (
    <>
      <RallyApp
        favoritesKey="mg-play-fav:preview"
        title={START.title}
        heroImageUrl={START.imageUrl}
        progress={progress}
        moment={MOMENT}
        stampEvent={event}
        onStampEventSeen={() => setEvent(null)}
        claimHref="/auth"
        loginHref="/auth"
        showLogin={false}
        replaying={false}
        replayError={null}
        onReplay={reset}
      />
      {event ? null : (
        <div
          className="flex flex-col items-end gap-2"
          style={{
            position: "fixed",
            right: 12,
            bottom: "calc(5.6rem + env(safe-area-inset-bottom, 0px))",
            zIndex: 45,
          }}
        >
          <span className="rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold text-white">プレビュー</span>
          {progress.completed ? (
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-[13px] font-bold text-[#1f7a4a] shadow-lg ring-1 ring-[#d5e7dc]"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              最初から
            </button>
          ) : (
            <button
              type="button"
              onClick={stampNext}
              className="flex items-center gap-1.5 rounded-full bg-[#d9452b] px-4 py-2.5 text-[13px] font-bold text-white shadow-lg"
            >
              <Stamp className="h-4 w-4" aria-hidden />
              スタンプを押す
            </button>
          )}
        </div>
      )}
    </>
  );
}
