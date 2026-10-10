"use client";

import { SpotPlaceMap } from "@/components/play/SpotPlaceMap";
import { usePlayCopy } from "@/components/play/usePlayCopy";

export function PlaySpotPlace({
  lat,
  lng,
  name,
  caption,
}: {
  lat: number | null | undefined;
  lng: number | null | undefined;
  name: string;
  caption?: string;
}) {
  const copy = usePlayCopy();
  if (lat == null || lng == null) return null;
  const href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
  return (
    <div className="play-place">
      {caption ? <p className="play-place__caption">{caption}</p> : null}
      <SpotPlaceMap className="play-place__map" lat={lat} lng={lng} label={copy.placeOf(name)} />
      <a href={href} target="_blank" rel="noopener noreferrer">
        {copy.openInMaps}
      </a>
    </div>
  );
}
