"use client";

import { useRef, type PointerEvent } from "react";
import Image from "next/image";
import {
  SEASONS,
  type SeasonKey,
} from "@/lib/posts/group-my-posts-by-season";
import type { AlbumSeasonFilter } from "@/lib/posts/my-album-view";
import { cn } from "@/lib/utils";

const SEASON_ICON: Record<SeasonKey, string> = {
  spring: "/profile/album/season-icon-spring.png",
  summer: "/profile/album/season-icon-summer.png",
  autumn: "/profile/album/season-icon-autumn.png",
  winter: "/profile/album/season-icon-winter.png",
};

const ORDER: SeasonKey[] = ["spring", "summer", "autumn", "winter"];
const SWIPE_PX = 40;

export function MyAlbumSeasonBar({
  value,
  onChange,
}: {
  value: AlbumSeasonFilter;
  onChange: (next: AlbumSeasonFilter) => void;
}) {
  const drag = useRef<{ x: number; active: boolean }>({ x: 0, active: false });

  const cycle = (dir: 1 | -1) => {
    const current = value === "all" ? -1 : ORDER.indexOf(value);
    const next = (current + dir + ORDER.length) % ORDER.length;
    onChange(ORDER[next]);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { x: e.clientX, active: true };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    const delta = e.clientX - drag.current.x;
    drag.current.active = false;
    if (Math.abs(delta) >= SWIPE_PX) {
      cycle(delta < 0 ? 1 : -1);
    }
  };

  return (
    <div
      className="mg-album-seasons"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        drag.current.active = false;
      }}
    >
      <div className="mg-album-seasons__track" role="tablist" aria-label="季節">
        {SEASONS.map((season) => {
          const on = value === season.key;
          return (
            <button
              key={season.key}
              type="button"
              role="tab"
              aria-selected={on}
              className={cn(
                "mg-album-seasons__item",
                `mg-album-seasons__item--${season.key}`,
                on && "is-active",
              )}
              onClick={() => onChange(on ? "all" : season.key)}
            >
              <span className="mg-album-seasons__head">
                <Image
                  src={SEASON_ICON[season.key]}
                  alt=""
                  width={18}
                  height={18}
                  className="mg-album-seasons__icon"
                  aria-hidden
                />
                <span className="mg-album-seasons__label">{season.label}</span>
              </span>
              <span className="mg-album-seasons__months">{season.months}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
