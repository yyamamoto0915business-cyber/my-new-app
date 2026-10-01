"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Crosshair, MapPin } from "lucide-react";
import type { MyPostItem } from "@/app/api/me/posts/route";
import { useRegionPreference } from "@/hooks/use-region-preference";
import {
  albumMapRegions,
  HOKKAIDO_CITIES,
  hokkaidoCitySlots,
  prefectureAlbumSlots,
  REGION_PLACE_MARKS,
  regionPlaceLabel,
  type AlbumMapRegion,
  type PrefectureAlbumSlot,
} from "@/lib/posts/prefecture-album-map";
import { getRegionIdForPrefecture, type RegionId } from "@/lib/prefectures";
import { reverseGeocodeRegion } from "@/lib/reverse-geocode-region";
import { cn } from "@/lib/utils";
import { MyAlbumMediaGrid } from "./MyAlbumMediaGrid";

type MapScope = "national" | "prefecture";

const SCOPES: { id: MapScope; label: string }[] = [
  { id: "national", label: "全国" },
  { id: "prefecture", label: "都道府県" },
];

export function MyAlbumMapPane({ posts }: { posts: MyPostItem[] }) {
  const slots = prefectureAlbumSlots();
  const regions = albumMapRegions();
  const [scope, setScope] = useState<MapScope>("national");
  const [showAllPrefectures, setShowAllPrefectures] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [regionId, setRegionId] = useState<RegionId | null>(null);
  const { preference } = useRegionPreference();
  const region = regions.find((item) => item.id === regionId) ?? null;
  const regionSlots = region
    ? slots.filter((slot) => (region.prefectures as readonly string[]).includes(slot.name))
    : [];

  const openRegion = (id: RegionId) => {
    setRegionId(id);
    setActive(null);
    setScope("national");
  };

  const select = (name: string) => {
    const nextRegion = getRegionIdForPrefecture(name);
    if (nextRegion) setRegionId(nextRegion === "okinawa" ? "kyushu" : nextRegion);
    setActive(name);
    setScope("national");
  };

  const locate = () => {
    const saved = preference.prefecture;
    if (saved && slots.some((slot) => slot.name === saved)) {
      select(saved);
      return;
    }
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const result = await reverseGeocodeRegion(
        pos.coords.latitude,
        pos.coords.longitude,
      );
      if (result && slots.some((slot) => slot.name === result.prefecture)) {
        select(result.prefecture);
      }
    });
  };

  const cardSlots =
    region?.id === "hokkaido" ? hokkaidoCitySlots() : scope === "prefecture" ? slots : regionSlots;
  const placeFocus = scope === "national" && region != null && active != null;
  const visibleSlots = placeFocus
    ? cardSlots.filter((slot) => (slot.city ?? slot.name) === active)
    : cardSlots;
  const placePosts = placeFocus ? postsForPlace(posts, visibleSlots[0]) : [];
  const showPlaceSection = scope === "prefecture" || placeFocus;

  return (
    <div className="mg-album-map">
      <div className="mg-album-map__bar">
        <div className="mg-album-map__scopes" role="tablist" aria-label="地図の範囲">
          {SCOPES.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={scope === item.id}
              className={cn("mg-album-map__scope", scope === item.id && "is-active")}
              onClick={() => {
                setScope(item.id);
                setShowAllPrefectures(false);
                if (item.id === "national") setRegionId(null);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <>
          {scope === "national" && !placeFocus ? (
            <>
              <p className="mg-album-map__lead">
                {region
                  ? region.id === "hokkaido"
                    ? "北海道のまちを見てみよう"
                    : `${region.label}の県を見てみよう`
                  : "地方を選ぶと、その県が見られます"}
              </p>
              <JapanMap
                regions={regions}
                region={region}
                active={active}
                onOpenRegion={openRegion}
                onSelect={select}
                onBack={() => {
                  setRegionId(null);
                  setActive(null);
                }}
                onLocate={locate}
              />
            </>
          ) : null}
          {showPlaceSection ? (
          <section className="mg-album-map__section" aria-label={region ? region.label : "地方から見る"}>
            <div className={cn("mg-album-map__head", showAllPrefectures && "mg-album-map__head--all")}>
              {showAllPrefectures ? (
                <img src="/profile/album/title-sprig.png" alt="" className="mg-album-map__sprig" />
              ) : null}
              {placeFocus && region ? (
                <button type="button" className="mg-album-map__back" onClick={() => setActive(null)}>
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                  {region.label}
                </button>
              ) : (
                <h2>
                  {showAllPrefectures ? "全国の都道府県" : region ? region.label : "地方から見る"}
                </h2>
              )}
              {showAllPrefectures ? (
                <svg className="mg-album-map__mountains" viewBox="0 0 220 56" aria-hidden>
                  <path
                    fill="#d5e0d4"
                    d="M0 56 18 34 36 44 58 18 74 32 96 8 118 30 142 14 168 36 190 20 220 38V56Z"
                  />
                </svg>
              ) : null}
              {scope === "national" && region ? (
                <button
                  type="button"
                  className="mg-album-map__all"
                  onClick={() => {
                    setRegionId(null);
                    setActive(null);
                  }}
                >
                  全国の地図
                </button>
              ) : showAllPrefectures ? (
                <button
                  type="button"
                  className="mg-album-map__all"
                  onClick={() => setShowAllPrefectures(false)}
                >
                  地方から見る
                </button>
              ) : (
                <button type="button" className="mg-album-map__all" onClick={() => setShowAllPrefectures(true)}>
                  全国 47都道府県
                  <span aria-hidden> ›</span>
                </button>
              )}
            </div>
            {placeFocus && region && active ? (
              <div className="mg-album-map__place">
                <div className="mg-album-map__place-name">
                  <h2>{active}</h2>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/profile/album/title-sprig.png" alt="" className="mg-album-map__place-sprig" />
                </div>
                <p>{region.id === "hokkaido" ? "北海道のまち" : `${region.label}の県`}</p>
              </div>
            ) : null}
            {scope === "prefecture" && !showAllPrefectures ? (
              <ul className="mg-album-map__cards">
                {regions.map((item) => (
                  <li key={item.id}>
                    <button type="button" className="mg-album-map__region-card" onClick={() => openRegion(item.id)}>
                      <span className="mg-album-map__card-name">{item.label}</span>
                      <span className="mg-album-map__card-count">{item.prefectures.length}県</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : placeFocus ? (
              placePosts.length > 0 ? (
                <div className="mg-album-map__photos">
                  <MyAlbumMediaGrid posts={placePosts} showMenu={false} />
                </div>
              ) : (
                <p className="mg-album-map__note">このまちの投稿は、まだありません。</p>
              )
            ) : (
              <ul className="mg-album-map__cards">
                {visibleSlots.map((slot) => (
                  <li key={slot.city ?? slot.name}>
                    <PrefectureCard
                      slot={slot}
                      active={active === (slot.city ?? slot.name)}
                      onSelect={select}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
          ) : null}
      </>
    </div>
  );
}

function areaHasPlace(area: string, needle: string) {
  if (!needle) return false;
  let from = 0;
  while (from < area.length) {
    const at = area.indexOf(needle, from);
    if (at < 0) return false;
    // 「東京都」に含まれる「京都」は京都府の投稿にしない
    if (!(needle === "京都" && area[at - 1] === "東")) return true;
    from = at + 1;
  }
  return false;
}

function postsForPlace(posts: MyPostItem[], slot: PrefectureAlbumSlot | undefined) {
  if (!slot) return [];
  const needles = slot.city ? [slot.city] : [slot.name, regionPlaceLabel(slot.name)];
  return posts.filter((post) => {
    if (post.status === "draft" || !post.imageUrl) return false;
    const area = post.areaLabel ?? "";
    return needles.some((needle) => areaHasPlace(area, needle));
  });
}

function JapanMap({
  regions,
  region,
  active,
  onOpenRegion,
  onSelect,
  onBack,
  onLocate,
}: {
  regions: AlbumMapRegion[];
  region: AlbumMapRegion | null;
  active: string | null;
  onOpenRegion: (id: RegionId) => void;
  onSelect: (name: string) => void;
  onBack: () => void;
  onLocate: () => void;
}) {
  return (
    <div className={cn("mg-album-japan", region && "is-region")}>
      <div className="mg-album-japan__stage">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={region ? region.image : "/profile/album/japan-region-map.jpg?v=2"}
          alt=""
          width={region ? 1254 : 1024}
          height={region ? 1254 : 768}
          className="mg-album-japan__art"
        />
        {region
          ? (region.id === "hokkaido"
              ? HOKKAIDO_CITIES.map((city) => ({ name: city.name, x: city.x, y: city.y }))
              : region.prefectures.flatMap((name) => {
                  const mark = REGION_PLACE_MARKS[name];
                  return mark ? [{ name, x: mark.x, y: mark.y }] : [];
                })
            ).map((place) => (
              <button
                key={place.name}
                type="button"
                className={cn("mg-album-japan__region", active === place.name && "is-active")}
                style={{ left: `${place.x}%`, top: `${place.y}%` }}
                onClick={() => onSelect(place.name)}
              >
                <MapPin className="mg-album-japan__region-pin" aria-hidden />
                <span>{regionPlaceLabel(place.name)}</span>
                <ChevronRight className="mg-album-japan__region-chevron" aria-hidden />
              </button>
            ))
          : regions.map((item) => (
              <button
                key={item.id}
                type="button"
                className="mg-album-japan__region"
                style={{ left: `${item.x}%`, top: `${item.y}%` }}
                onClick={() => onOpenRegion(item.id)}
              >
                <MapPin className="mg-album-japan__region-pin" aria-hidden />
                <span>{item.label}</span>
                <ChevronRight className="mg-album-japan__region-chevron" aria-hidden />
              </button>
            ))}
      </div>
      {region ? (
        <button type="button" className="mg-album-japan__back" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" aria-hidden />
          全国
        </button>
      ) : null}
      <button type="button" className="mg-album-japan__locate" aria-label="現在地の都道府県を見る" onClick={onLocate}>
        <Crosshair className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

function PrefectureCard({
  slot,
  active,
  onSelect,
}: {
  slot: PrefectureAlbumSlot;
  active: boolean;
  onSelect: (name: string) => void;
}) {
  return (
    <button
      id={`album-pref-${slot.city ?? slot.name}`}
      type="button"
      className={cn("mg-album-map__card", active && "is-active")}
      onClick={() => onSelect(slot.city ?? slot.name)}
    >
      <span className="mg-album-map__card-photo">
        <Image src={slot.image} alt="" fill className="object-cover" sizes="80px" />
      </span>
      <span className="mg-album-map__card-body">
        <span className="mg-album-map__card-name">{slot.city ?? slot.name}</span>
        <span className="mg-album-map__card-count">{slot.postCount}件の投稿</span>
      </span>
      <ChevronRight className="mg-album-map__card-chevron" aria-hidden />
    </button>
  );
}

