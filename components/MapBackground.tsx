"use client";

import { usePathname } from "next/navigation";
import { useMemo, useEffect, useState } from "react";
import { routeToSpotKey, SPOTS, type SpotKey } from "@/components/map/spots";

const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 600;
const FOOTPRINT_CX = 24;
const FOOTPRINT_CY = 40;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

/**
 * サイト全体の白い高級紙背景 + 靴の足あと
 * 紙色＋グレイン＋SVGオーバーレイ（足あとのみ）
 */
export function MapBackground() {
  const pathname = usePathname();
  const prefersReducedMotion = usePrefersReducedMotion();

  const spotKey = useMemo<SpotKey>(() => routeToSpotKey(pathname ?? "/"), [pathname]);
  const spot = SPOTS[spotKey];

  const footprintStyle = useMemo(() => {
    const { x, y, rotate, scale } = spot;
    const tx = x - FOOTPRINT_CX;
    const ty = y - FOOTPRINT_CY;
    return {
      transform: `translate(${tx}, ${ty}) rotate(${rotate}) scale(${scale})`,
      transition: prefersReducedMotion
        ? "none"
        : "transform 380ms ease-out",
      transformOrigin: `${FOOTPRINT_CX}px ${FOOTPRINT_CY}px`,
    };
  }, [spot, prefersReducedMotion]);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden"
      aria-hidden
    >
      {/* 白い高級感のある紙（地図なし） */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "var(--mg-paper)" }}
      />

      {/* スポット + 足あと SVG（viewBox 1000x600） */}
      <svg
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <filter id="footprint-shadow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
            <feOffset in="blur" dx="0.8" dy="1" result="offset" />
            <feColorMatrix in="offset" type="matrix" values="0 0 0 0 0.15 0 0 0 0 0.12 0 0 0 0 0.1 0 0 0 0.4 0" result="shadow" />
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="footprint-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="glowBlur" />
            <feFlood floodColor="#b8860b" floodOpacity="0.12" result="glowColor" />
            <feComposite in="glowBlur" in2="glowColor" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* 足あと（墨っぽい質感・にじみ影＋ネオングロー） */}
        <g style={footprintStyle}>
          <g fill="var(--mg-ink)" filter="url(#footprint-shadow) url(#footprint-glow)" opacity="0.92">
            <FootprintPaths />
          </g>
        </g>
      </svg>

      {/* 高級感グレイン（紙質ノイズ・控えめ） */}
      <div
        className="pointer-events-none absolute inset-0 z-[0] mix-blend-multiply dark:mix-blend-overlay opacity-[0.04]"
        aria-hidden
        style={{
          backgroundImage: `repeating-conic-gradient(
            var(--mg-ink) 0% 0.25%,
            transparent 0% 0.5%
          )`,
          backgroundSize: "2px 2px",
        }}
      />
    </div>
  );
}

/** 足あとパス（墨風・viewBox 0 0 48 80） */
function FootprintPaths() {
  return (
    <g>
      <path
        d="M24 4 C12 4 6 16 6 28 C6 36 10 42 16 48 L18 72 C18 76 22 78 24 78 C26 78 30 76 30 72 L32 48 C38 42 42 36 42 28 C42 16 36 4 24 4 Z"
        fill="currentColor"
      />
      <path
        d="M22 8 C14 10 10 20 10 30 C10 38 13 44 18 50 L20 68 C20 72 22 74 24 74 C26 74 28 72 28 68 L30 50 C35 44 38 38 38 30 C38 20 34 10 26 8 Z"
        fill="currentColor"
        opacity="0.6"
      />
    </g>
  );
}
