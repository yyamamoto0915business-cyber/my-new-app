"use client";

import { useEffect, useState } from "react";
import type { Event } from "@/lib/db/types";
import { HOME_SPOT } from "./map/spots";
import { RECOMMENDED_PIN_POSITIONS } from "./map/recommended-pin-positions";

const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 600;

/** 道のカーブ量（制御点のオフセット、大きくすると曲線が強く） */
const CURVE_OFFSET = 60;

type Props = {
  selectedEvent: Event | null;
  recommendedEvents: Event[];
};

/**
 * HOME足あと → 選択中ピン への点線の道（足あと道）
 * 選択中のみ表示。pointer-events: none で操作を妨げない。
 */
export function MapPathLayer({ selectedEvent, recommendedEvents }: Props) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const h = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  const selectedIndex = selectedEvent
    ? recommendedEvents.findIndex((e) => e.id === selectedEvent.id)
    : -1;

  const endPos = selectedIndex >= 0 ? RECOMMENDED_PIN_POSITIONS[selectedIndex] : null;

  if (!endPos) return null;

  const sx = HOME_SPOT.x;
  const sy = HOME_SPOT.y;
  const ex = endPos.x;
  const ey = endPos.y;
  const midX = (sx + ex) / 2;
  const midY = (sy + ey) / 2;
  const cy = midY - CURVE_OFFSET;
  const pathD = `M ${sx} ${sy} Q ${midX} ${cy} ${ex} ${ey}`;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <g
        style={{
          transition: prefersReducedMotion ? "none" : "opacity 350ms ease-out",
        }}
      >
        {/* 点線の道 */}
        <path
          d={pathD}
          fill="none"
          stroke="var(--mg-ink)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="2 10"
          strokeOpacity="0.18"
        />
        {/* 先頭の1点（真鍮アクセント） */}
        <circle
          cx={sx}
          cy={sy}
          r="3"
          fill="var(--mg-accent)"
          opacity="0.8"
        />
      </g>
    </svg>
  );
}
