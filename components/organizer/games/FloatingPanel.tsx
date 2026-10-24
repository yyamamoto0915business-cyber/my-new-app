"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

const MARGIN = 8;

const CSS = `
.floating-panel .edit-panel { border: 0; background: transparent; box-shadow: none; animation: none; max-height: min(52dvh, 22rem) !important; padding: 0.1rem 0.7rem 0.55rem; }
.floating-panel .edit-panel__head { margin-bottom: 0.2rem; }
.floating-panel .edit-panel__head b { font-size: 0.78rem; }
.floating-panel .edit-panel__head button { width: 1.7rem; height: 1.7rem; }
.floating-panel .edit-panel__rows { gap: 0.4rem; }
.floating-panel .edit-panel__row { align-items: flex-start; }
.floating-panel .edit-panel__row > span { padding-top: 0.3rem; }
.floating-panel .edit-panel__row > div { flex-wrap: wrap; overflow: visible; }
.floating-panel .edit-panel__swatch { width: 1.5rem; height: 1.5rem; }
.floating-panel .edit-panel__choice { min-height: 1.7rem; padding: 0 0.55rem; font-size: 0.72rem; }
.floating-panel .edit-panel__media { display: flex; gap: 0.4rem; }
.floating-panel .edit-panel__media > div { flex-direction: row; align-items: center; gap: 0.5rem; padding: 0; background: none; border: 0; }
.floating-panel .edit-panel__media > div > span { font-size: 0.7rem; }
.floating-panel .edit-panel__media > div > div { flex-direction: row; }
.floating-panel .edit-panel__media > div > div button { width: auto !important; min-height: 1.7rem; padding: 0 0.8rem; font-size: 0.72rem; border-radius: 999px; }
.floating-panel .edit-panel__rows > .edit-panel__choice { align-self: flex-start; }
`;

/**
 * 選んだものの近くに出して、つまみをドラッグしてどこへでも動かせるポップアップ。
 * 下に出すと隠れるときは、自動で上に出す。
 */
export function FloatingPanel({
  getAnchor,
  anchorKey,
  children,
}: {
  /** 選んでいるものの要素（この近くに出す）。 */
  getAnchor: () => Element | null;
  /** これが変わったら、出す場所を測り直す。 */
  anchorKey: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useLayoutEffect(() => {
    const box = ref.current;
    if (!box) return;
    const width = box.offsetWidth;
    const height = box.offsetHeight;
    const anchor = getAnchor()?.getBoundingClientRect();
    let x = (window.innerWidth - width) / 2;
    let y = window.innerHeight - height - MARGIN;
    if (anchor) {
      x = anchor.left + anchor.width / 2 - width / 2;
      y = anchor.bottom + MARGIN;
      if (y + height > window.innerHeight - MARGIN) y = anchor.top - height - MARGIN;
    }
    setPos({
      x: Math.min(Math.max(MARGIN, x), Math.max(MARGIN, window.innerWidth - width - MARGIN)),
      y: Math.min(Math.max(MARGIN, y), Math.max(MARGIN, window.innerHeight - height - MARGIN)),
    });
    // 選んだものが変わったときだけ測り直す（動かしたあとは、そのまま）。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorKey]);

  function startDrag(event: ReactPointerEvent) {
    const box = ref.current;
    if (!box || event.button > 0) return;
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const origin = pos ?? { x: box.offsetLeft, y: box.offsetTop };
    const onMove = (ev: PointerEvent) => {
      const x = origin.x + ev.clientX - startX;
      const y = origin.y + ev.clientY - startY;
      setPos({
        x: Math.min(Math.max(MARGIN, x), Math.max(MARGIN, window.innerWidth - box.offsetWidth - MARGIN)),
        y: Math.min(Math.max(MARGIN, y), Math.max(MARGIN, window.innerHeight - box.offsetHeight - MARGIN)),
      });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  const style: CSSProperties = {
    position: "fixed",
    left: pos?.x ?? 0,
    top: pos?.y ?? 0,
    visibility: pos ? "visible" : "hidden",
    zIndex: 1100,
    width: "min(23rem, calc(100vw - 1rem))",
    overflow: "hidden",
    border: "1px solid #dfe7e1",
    borderRadius: "1rem",
    background: "rgba(255, 255, 255, 0.97)",
    boxShadow: "0 14px 36px rgba(23, 40, 30, 0.28)",
  };

  return createPortal(
    <div ref={ref} className="floating-panel" style={style}>
      <style>{CSS}</style>
      <div
        onPointerDown={startDrag}
        title="ドラッグして動かす"
        aria-label="ドラッグして動かす"
        style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "1.1rem", cursor: "grab", touchAction: "none" }}
      >
        <span style={{ width: "2.2rem", height: "0.25rem", borderRadius: 999, background: "#cfd8d2" }} />
      </div>
      {children}
    </div>,
    document.body,
  );
}
