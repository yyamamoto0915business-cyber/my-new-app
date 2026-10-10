"use client";

import { useState } from "react";
import { SpotPlaceMap } from "@/components/play/SpotPlaceMap";
import styles from "@/components/organizer/games/StampRallyWizard.module.css";

type Place = { lat: number; lng: number };

export function SpotPinField({
  lat,
  lng,
  onChange,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (place: Place | null) => void;
}) {
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const placed = lat != null && lng != null;

  function useHere() {
    if (!navigator.geolocation) {
      setLocError("この端末では現在地を取れません");
      return;
    }
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          lat: Math.round(pos.coords.latitude * 1e6) / 1e6,
          lng: Math.round(pos.coords.longitude * 1e6) / 1e6,
        });
        setLocating(false);
      },
      () => {
        setLocError("現在地を取得できませんでした");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    );
  }

  return (
    <div className={styles.imageField}>
      <span>場所</span>
      <div className={styles.pinWrap}>
        <SpotPlaceMap
          className={styles.pinMap}
          lat={lat}
          lng={lng}
          interactive
          label="スポットの場所。地図をタップしてピンを置きます"
          onChange={onChange}
        />
        {placed ? null : <p className={styles.pinHint}>タップして場所を置く</p>}
      </div>
      <div className={styles.imageActions}>
        <button type="button" onClick={useHere} disabled={locating}>
          {locating ? "取得しています…" : "現在地を置く"}
        </button>
        <button type="button" onClick={() => onChange(null)} disabled={!placed}>
          ピンを外す
        </button>
      </div>
      <small>地図をタップして場所を置きます。GPSのスポットは、この場所の半径内で押せます。</small>
      {locError ? <small>{locError}</small> : null}
    </div>
  );
}
