"use client";

import { useEffect, useState } from "react";
import type { Event } from "@/lib/db/types";
import { RECOMMENDED_PIN_POSITIONS } from "./map/recommended-pin-positions";

const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 600;

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + "…";
}

type Props = {
  events: Event[];
  onSelectEvent: (event: Event) => void;
};

/**
 * おすすめイベントのピン（足あと/点列モチーフ）
 * 最大3件。クリックでクイックビュー表示
 */
export function MapPinsLayer({ events, onSelectEvent }: Props) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const h = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  const displayEvents = events.slice(0, RECOMMENDED_PIN_POSITIONS.length);

  if (displayEvents.length === 0) return null;

  const transition = prefersReducedMotion ? "none" : "opacity 200ms, transform 200ms";

  return (
    <svg
      className="absolute inset-0 h-full w-full pointer-events-none [&_button]:pointer-events-auto"
      preserveAspectRatio="xMidYMid slice"
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {displayEvents.map((event, i) => {
        const pos = RECOMMENDED_PIN_POSITIONS[i];
        if (!pos) return null;
        const shortTitle = truncate(event.title, 10);
        return (
          <g key={event.id} transform={`translate(${pos.x}, ${pos.y})`}>
            <button
              type="button"
              onClick={() => onSelectEvent(event)}
              className="group cursor-pointer touch-manipulation border-none bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--mg-accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-transparent"
              aria-label={`${event.title}の詳細を見る`}
              style={{ transition }}
            >
              {/* 足あと/点列モチーフ：点＋薄い円 */}
              <g fill="var(--mg-ink)" stroke="none" className="opacity-70 transition-opacity duration-200 group-hover:opacity-95 group-focus-visible:opacity-95">
                <circle r="2.5" fill="currentColor" className="group-hover:opacity-100" />
                <circle r="14" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
              </g>
              <text
                x="0"
                y="26"
                textAnchor="middle"
                fontSize="10"
                fontFamily="var(--font-serif), serif"
                fill="var(--mg-ink)"
                opacity="0.75"
                className="pointer-events-none"
              >
                {shortTitle}
              </text>
            </button>
          </g>
        );
      })}
    </svg>
  );
}
