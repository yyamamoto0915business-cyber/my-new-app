"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { LocateFixed, MapPin, Search, X } from "lucide-react";
import styles from "@/components/organizer/games/StampRallyWizard.module.css";
import { SpotPinField } from "@/components/organizer/games/SpotPinField";
import { spotMarkerUrl } from "@/components/play/rally/spotCategory";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { cn } from "@/lib/utils";
import "@/components/play/rally/rally.css";

const RallyVectorMap = dynamic(
  () => import("@/components/play/rally/RallyVectorMap").then((mod) => mod.RallyVectorMap),
  { ssr: false, loading: () => <div className="rally-map__canvas" /> },
);

const RALLY_MAP_VARS = {
  "--rally-green": "#1f7a4a",
  "--rally-green-soft": "#e7f4ec",
  "--rally-line": "#e2ebe5",
  "--rally-muted": "#66726a",
  "--rally-red": "#d9452b",
} as CSSProperties;

type Place = { lat: number; lng: number };

/**
 * 位置情報スタンプラリーと同じ、場所を選ぶ画面。
 * 住所・地名で探す → 立体の地図を動かして、真ん中のピンを合わせる → 「この場所に決める」。
 */
export function PlacePickerDialog({
  title,
  value,
  onPick,
  onClose,
}: {
  title: string;
  value: Place | null;
  /** 決めた場所。null は場所を外す。 */
  onPick: (place: Place | null) => void;
  onClose: () => void;
}) {
  const [center, setCenter] = useState<Place | null>(value);
  const [focus, setFocus] = useState<{ lat: number; lng: number; zoom?: number; key: number } | null>(
    value ? { ...value, zoom: 17, key: Date.now() } : null,
  );
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ title: string; lat: number; lng: number }[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  // 場所がまだないときは、位置情報を許可済みなら現在地のあたりから始める（許可を新しく求めない）。
  useEffect(() => {
    if (value) return;
    let cancelled = false;
    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((status) => {
        if (cancelled || status.state !== "granted") return;
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!cancelled) setFocus({ lat: pos.coords.latitude, lng: pos.coords.longitude, zoom: 15.5, key: Date.now() });
          },
          () => undefined,
          { maximumAge: 60000, timeout: 8000 },
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // 開いたときに一度だけ見る。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 国土地理院の住所検索（キー不要）。施設名より住所・地名に強い。 */
  async function search() {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetchWithTimeout(
        `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(q)}`,
        {},
        8000,
      );
      const rows = (await res.json()) as { geometry?: { coordinates?: [number, number] }; properties?: { title?: string } }[];
      const places = (Array.isArray(rows) ? rows : [])
        .flatMap((row) => {
          const [lng, lat] = row.geometry?.coordinates ?? [];
          const name = row.properties?.title ?? "";
          return typeof lat === "number" && typeof lng === "number" && name ? [{ title: name, lat, lng }] : [];
        })
        .slice(0, 5);
      if (places.length === 0) {
        setResults([]);
        setSearchError("見つかりませんでした。住所や地名で探してみてください。");
        return;
      }
      if (places.length === 1) {
        setFocus({ lat: places[0]!.lat, lng: places[0]!.lng, zoom: 16.5, key: Date.now() });
        setResults([]);
        return;
      }
      setResults(places);
    } catch {
      setSearchError("検索できませんでした。通信を確かめて、もう一度お試しください。");
    } finally {
      setSearching(false);
    }
  }

  /** 地図を現在地のあたりへ動かす。 */
  function goToHere() {
    if (!navigator.geolocation) {
      setLocateError("この端末では現在地を取れません");
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFocus({ lat: pos.coords.latitude, lng: pos.coords.longitude, zoom: 16.5, key: Date.now() });
        setLocating(false);
      },
      () => {
        setLocateError("現在地を取得できませんでした。位置情報の利用を許可してください。");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    );
  }

  return createPortal(
    <div className={styles.picker} role="dialog" aria-modal="true" aria-label="場所を選ぶ">
      <div className={styles.pickerHead}>
        <button type="button" className={styles.pickerClose} onClick={onClose} aria-label="閉じる">
          <X className="h-5 w-5" aria-hidden />
        </button>
        <b>{title}</b>
      </div>
      <form
        className={cn(styles.placeSearch, styles.pickerSearch)}
        onSubmit={(event) => {
          event.preventDefault();
          void search();
        }}
      >
        <Search className="h-4 w-4" aria-hidden />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="住所・地名で探す"
          enterKeyHint="search"
          aria-label="住所・地名で探す"
        />
        <button type="submit" disabled={searching || !query.trim()}>
          {searching ? "…" : "検索"}
        </button>
      </form>
      {results.length > 0 ? (
        <ul className={cn(styles.placeResults, styles.pickerResults)}>
          {results.map((place, index) => (
            <li key={`${place.title}-${index}`}>
              <button
                type="button"
                onClick={() => {
                  setFocus({ lat: place.lat, lng: place.lng, zoom: 17, key: Date.now() });
                  setResults([]);
                }}
              >
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {place.title}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {searchError ? <p className={cn(styles.placeError, styles.pickerError)}>{searchError}</p> : null}
      <div className={cn("rally-map", styles.pickerMap)} style={RALLY_MAP_VARS}>
        {unavailable ? (
          <div className={styles.pickerFallback}>
            <SpotPinField lat={center?.lat ?? null} lng={center?.lng ?? null} onChange={(place) => setCenter(place)} />
          </div>
        ) : (
          <>
            <RallyVectorMap
              spots={[]}
              selectedId={null}
              here={null}
              focus={focus}
              onSelect={() => undefined}
              onCenterChange={setCenter}
              label="地図を動かして、真ん中のピンを場所に合わせます"
              onUnavailable={() => setUnavailable(true)}
            />
            <div className={styles.pickerPin} aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element -- 地図の真ん中のピン */}
              <img src={spotMarkerUrl({ icon: "stamp" })} alt="" />
              <span />
            </div>
            <p className={styles.pickerHint}>地図を動かして、ピンを場所に合わせてください</p>
            <button type="button" className={styles.pickerLocate} onClick={goToHere} disabled={locating}>
              <LocateFixed className="h-4 w-4" aria-hidden />
              {locating ? "取得中…" : "現在地へ"}
            </button>
          </>
        )}
      </div>
      {locateError ? <p className={cn(styles.placeError, styles.pickerError)}>{locateError}</p> : null}
      <div className={styles.pickerFoot}>
        {value ? (
          <button
            type="button"
            className={styles.textAction}
            onClick={() => {
              onPick(null);
              onClose();
            }}
          >
            場所を外す
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          className={styles.primary}
          disabled={!center}
          onClick={() => {
            if (!center) return;
            onPick(center);
            onClose();
          }}
        >
          この場所に決める
        </button>
      </div>
    </div>,
    document.body,
  );
}
