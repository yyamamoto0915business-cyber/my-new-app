"use client";

import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { GAME_SPOT_ICONS, GAME_SPOT_ICON_IDS } from "@/lib/organizer/game-experience";
import { cn } from "@/lib/utils";

type Tab = "mascot" | "building" | "marker" | "nature" | "photo";

const TABS: { id: Tab; label: string }[] = [
  { id: "mascot", label: "マスコット" },
  { id: "building", label: "建物" },
  { id: "marker", label: "マーカー" },
  { id: "nature", label: "木・自然" },
  { id: "photo", label: "写真" },
];

/** アプリに入っている絵。参加者の画面でもそのまま使える。 */
const ART: Record<Exclude<Tab, "photo">, { url: string; label: string }[]> = {
  mascot: [
    { url: "/organizer/games/loading-mascot-1.png", label: "旗" },
    { url: "/organizer/games/loading-mascot-3.png", label: "マスコット3" },
    { url: "/organizer/games/hub-mascot.png", label: "マスコット4" },
  ],
  building: GAME_SPOT_ICON_IDS.map((id) => ({ url: `/play/spots/${id}.webp`, label: GAME_SPOT_ICONS[id].label })),
  marker: [
    "stamp",
    "recommend",
    "shrine",
    "food",
    "shop",
    "sightseeing",
    "event",
    "culture",
    "park",
    "kitchen-car",
    "stay",
    "other",
  ].map((id) => ({ url: `/play/markers/${id}.png`, label: id })),
  nature: [
    { url: "/play/map/tree-large.png", label: "大きな木" },
    { url: "/play/map/tree-medium.png", label: "木" },
    { url: "/play/map/tree-sakura.png", label: "桜" },
    { url: "/play/map/tree-pine.png", label: "松" },
  ],
};

/** スタート画面に足す画像を選ぶ。イラストはタップで、写真はアップロードで足す。 */
export function StartImagePicker({
  onPick,
  onClose,
  uploadField,
}: {
  onPick: (url: string) => void;
  onClose: () => void;
  uploadField: ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("mascot");
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="img-picker" role="dialog" aria-label="画像を追加">
      <div className="img-picker__sheet edit-panel">
        <div className="img-picker__head">
          <b>画像を追加</b>
          <button type="button" onClick={onClose} aria-label="閉じる">
            <X aria-hidden />
          </button>
        </div>
        <div className="img-picker__tabs" role="tablist">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={cn(tab === item.id && "is-on")}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        {tab === "photo" ? (
          <div className="img-picker__photo">
            <p>お店や会場の写真、ロゴなどを入れられます。</p>
            {uploadField}
          </div>
        ) : (
          <div className="img-picker__grid">
            {ART[tab].map((item) => (
              <button key={item.url} type="button" onClick={() => onPick(item.url)} title={item.label}>
                <img src={item.url} alt={item.label} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
