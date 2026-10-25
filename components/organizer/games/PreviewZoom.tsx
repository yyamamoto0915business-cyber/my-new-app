"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { Minus, Plus } from "lucide-react";

const ZOOM_KEY = "org-game-preview-zoom";
const ZOOM_MIN = 0.4;
const ZOOM_MAX = 1.2;

function readSavedZoom(): number | null {
  try {
    const value = Number(localStorage.getItem(ZOOM_KEY));
    return value >= ZOOM_MIN && value <= ZOOM_MAX ? value : null;
  } catch {
    return null;
  }
}

function saveZoom(value: number | null) {
  try {
    if (value === null) localStorage.removeItem(ZOOM_KEY);
    else localStorage.setItem(ZOOM_KEY, String(value));
  } catch {
    // 保存できなくても、その場の大きさは変えられる。
  }
}

/**
 * プレビューのスマホ枠の大きさ。
 * ふだんは置き場所に収まる大きさ（fit）。−／＋で選んだら、その大きさにする（次に開いたときも同じ）。
 */
export function usePreviewZoom(stageRef: RefObject<HTMLDivElement | null>, phoneW: number, phoneH: number) {
  const [fitScale, setFitScale] = useState(0.7);
  const [zoom, setZoomState] = useState<number | null>(null);
  const zoomRef = useRef<number | null>(null);

  useEffect(() => {
    // 大きさの調整は PC の横のプレビューだけ（スマホの全画面ではいつも画面に合わせる）。
    if (!window.matchMedia("(min-width: 1080px)").matches) return;
    const saved = readSavedZoom();
    zoomRef.current = saved;
    setZoomState(saved);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      // 大きさを選んでいる間は、枠の高さがスマホに合わせて伸びるので測らない。
      if (zoomRef.current !== null) return;
      const { width, height } = stage.getBoundingClientRect();
      // PC では左右に追加ボタンの場所を空けるので、その分を除いて合わせる。
      const style = getComputedStyle(stage);
      const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const next = Math.min(1, (width - padX - 4) / phoneW, (height - 4) / phoneH);
      if (next > 0) setFitScale(Math.round(next * 100) / 100);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [stageRef, phoneW, phoneH]);

  function setZoom(value: number | null) {
    const next = value === null ? null : Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value)) * 10) / 10;
    zoomRef.current = next;
    setZoomState(next);
    saveZoom(next);
  }

  const scale = zoom ?? fitScale;
  return { scale, zoomed: zoom !== null, setZoom };
}

export function PreviewZoom({
  scale,
  zoomed,
  setZoom,
}: {
  scale: number;
  zoomed: boolean;
  setZoom: (value: number | null) => void;
}) {
  return (
    <div className="wizard-preview__zoom">
      <button
        type="button"
        className="wizard-preview__zoom-step"
        aria-label="小さくする"
        disabled={scale <= ZOOM_MIN + 0.001}
        onClick={() => setZoom(Math.ceil(scale * 10 - 1.001) / 10)}
      >
        <Minus aria-hidden />
      </button>
      <span className="wizard-preview__zoom-value">実寸の{Math.round(scale * 100)}%</span>
      <button
        type="button"
        className="wizard-preview__zoom-step"
        aria-label="大きくする"
        disabled={scale >= ZOOM_MAX - 0.001}
        onClick={() => setZoom(Math.floor(scale * 10 + 1.001) / 10)}
      >
        <Plus aria-hidden />
      </button>
      {zoomed ? (
        <button type="button" onClick={() => setZoom(null)}>
          画面に合わせる
        </button>
      ) : null}
    </div>
  );
}
