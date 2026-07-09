"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * ルート変更時に上部に薄いプログレスバーを表示する。
 * - リンククリック時 → バーが画面幅の85%まで走り続ける
 * - pathname変更時（遷移完了）→ 100%にジャンプしてフェードアウト
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const barRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // リンククリック → バー開始
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as Element)?.closest("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      // 外部リンク・アンカー・メールは無視
      if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:")) return;

      bar.style.transition = "none";
      bar.style.opacity = "1";
      bar.style.width = "0%";
      // reflow で transition リセットを確定させる
      void bar.offsetWidth;
      bar.style.transition = "width 8s linear";
      bar.style.width = "85%";
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // pathname 変更 → 遷移完了、バーを閉じる
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    bar.style.transition = "width 0.15s ease-out, opacity 0.3s ease 0.15s";
    bar.style.width = "100%";
    const t = setTimeout(() => {
      if (!barRef.current) return;
      barRef.current.style.opacity = "0";
      const t2 = setTimeout(() => {
        if (!barRef.current) return;
        barRef.current.style.transition = "none";
        barRef.current.style.width = "0%";
        barRef.current.style.opacity = "1";
      }, 350);
      return () => clearTimeout(t2);
    }, 150);

    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <div
      ref={barRef}
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "0%",
        height: "2.5px",
        background: "linear-gradient(90deg, #2e7d58, #4ab87a)",
        zIndex: 9999,
        pointerEvents: "none",
        opacity: 1,
        boxShadow: "0 0 8px rgba(74,184,122,0.6)",
      }}
    />
  );
}
