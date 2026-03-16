"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, CSSProperties } from "react";
import { UserMenu } from "@/components/header/UserMenu";

const STORAGE_KEY = "machiglyph-organizer-fab-position";

type Position = {
  x: number;
  y: number;
};

type DragState = {
  active: boolean;
  hasDragged: boolean;
  startPointerX: number;
  startPointerY: number;
  startX: number;
  startY: number;
  width: number;
  height: number;
};

const DRAG_DISTANCE_THRESHOLD_PX = 8;
const EDGE_MARGIN_PX = 12;
const BOTTOM_SAFE_MARGIN_PX = 96;

export function FloatingUserMenuFab() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState>({
    active: false,
    hasDragged: false,
    startPointerX: 0,
    startPointerY: 0,
    startX: 0,
    startY: 0,
    width: 56,
    height: 48,
  });

  const [position, setPosition] = useState<Position | null>(null);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    let initial: Position | null = null;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Position;
        if (
          typeof parsed?.x === "number" &&
          typeof parsed?.y === "number" &&
          Number.isFinite(parsed.x) &&
          Number.isFinite(parsed.y)
        ) {
          initial = parsed;
        }
      }
    } catch {
      // ignore parse errors
    }

    if (!initial) {
      const vw = window.innerWidth || 375;
      const vh = window.innerHeight || 667;
      const approxWidth = dragStateRef.current.width;
      const approxHeight = dragStateRef.current.height;

      const x = Math.max(
        EDGE_MARGIN_PX,
        vw - approxWidth - EDGE_MARGIN_PX
      );

      const bottomLimit =
        vh - approxHeight - BOTTOM_SAFE_MARGIN_PX - EDGE_MARGIN_PX;
      const y = Math.max(EDGE_MARGIN_PX, bottomLimit);

      initial = { x, y };
    }

    setPosition(initial);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    dragStateRef.current.width = rect.width || dragStateRef.current.width;
    dragStateRef.current.height = rect.height || dragStateRef.current.height;
  }, [position]);

  const clampPosition = (pos: Position): Position => {
    if (typeof window === "undefined") return pos;
    const vw = window.innerWidth || 375;
    const vh = window.innerHeight || 667;
    const { width, height } = dragStateRef.current;

    const minX = EDGE_MARGIN_PX;
    const maxX = Math.max(minX, vw - width - EDGE_MARGIN_PX);

    const minY = EDGE_MARGIN_PX;
    const maxY = Math.max(
      minY,
      vh - height - BOTTOM_SAFE_MARGIN_PX
    );

    return {
      x: Math.min(Math.max(pos.x, minX), maxX),
      y: Math.min(Math.max(pos.y, minY), maxY),
    };
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if (typeof window === "undefined") return;
    if (!position) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      dragStateRef.current.width = rect.width || dragStateRef.current.width;
      dragStateRef.current.height = rect.height || dragStateRef.current.height;
    }

    dragStateRef.current.active = true;
    dragStateRef.current.hasDragged = false;
    dragStateRef.current.startPointerX = event.clientX;
    dragStateRef.current.startPointerY = event.clientY;
    dragStateRef.current.startX = position.x;
    dragStateRef.current.startY = position.y;

    try {
      containerRef.current?.setPointerCapture(event.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = dragStateRef.current;
    if (!state.active || !position) return;

    const dx = event.clientX - state.startPointerX;
    const dy = event.clientY - state.startPointerY;
    const distance = Math.hypot(dx, dy);

    if (!state.hasDragged && distance < DRAG_DISTANCE_THRESHOLD_PX) {
      return;
    }

    state.hasDragged = true;

    const next = clampPosition({
      x: state.startX + dx,
      y: state.startY + dy,
    });

    setPosition(next);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = dragStateRef.current;
    if (!state.active) return;

    state.active = false;

    try {
      containerRef.current?.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }

    if (!state.hasDragged || !position) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (typeof window === "undefined") return;

    const vw = window.innerWidth || 375;
    const { width } = state;

    const snappedX =
      position.x + width / 2 < vw / 2
        ? EDGE_MARGIN_PX
        : Math.max(EDGE_MARGIN_PX, vw - width - EDGE_MARGIN_PX);

    const snapped = clampPosition({
      x: snappedX,
      y: position.y,
    });

    setPosition(snapped);

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapped));
    } catch {
      // ignore
    }
  };

  if (!position) {
    return null;
  }

  const style: CSSProperties = {
    top: position.y,
    left: position.x,
  };

  return (
    <div
      ref={containerRef}
      className="fixed z-50 flex items-center justify-end gap-2"
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <UserMenu />
    </div>
  );
}

