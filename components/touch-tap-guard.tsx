"use client";

import { useEffect } from "react";

/** 指がこれ以上動いたら「押した」ではなく「スクロール」とみなす（px） */
const MOVE_TOLERANCE_PX = 10;
/** スクロールが止まってからこの時間内に触れたのは「スクロールを止めるため」とみなす（ms） */
const SCROLL_SETTLE_MS = 140;
/** タッチが終わってからこの時間内に来た click だけを、タッチによるものとして調べる（ms） */
const CLICK_AFTER_TOUCH_MS = 700;
/** 指を離したあと、惰性のスクロールが続くとみなす時間（ms） */
const MOMENTUM_MS = 3000;

/**
 * スマホで「押したつもりがないのに画面が移る」のを防ぐ。
 *
 * iPhone では、流れているスクロールを指で止めたときや、少し指を動かしてから離したときに、
 * その場所のリンクが押されたことになる場合がある。次のどれかに当たるタッチの click は取り消す。
 * - 触れた時点で、まだスクロールが動いていた（止まって 140ms 以内）
 * - 触れているあいだにスクロールが動いた
 * - 指が 10px 以上動いた
 *
 * click は window の capture で先に受けて止めるので、Next.js の Link（React の onClick）にも届かない。
 * マウス・キーボードの click は調べない。
 */
export function TouchTapGuard() {
  useEffect(() => {
    if (typeof window === "undefined" || !("ontouchstart" in window)) return;

    let lastScrollAt = -Infinity;
    let startX = 0;
    let startY = 0;
    let suspicious = false;
    let touching = false;
    let touchEndedAt = -Infinity;

    const onScroll = () => {
      const now = performance.now();
      // 指で動かしたスクロール（触れている間と、離したあとの惰性）だけを数える。
      // 自動で流れるバナーなどの scroll で、ふつうのタップを止めないようにする
      if (!touching && now - touchEndedAt > MOMENTUM_MS) return;
      lastScrollAt = now;
      if (touching) suspicious = true;
    };

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t || e.touches.length > 1) {
        suspicious = true;
        return;
      }
      touching = true;
      startX = t.clientX;
      startY = t.clientY;
      suspicious = performance.now() - lastScrollAt < SCROLL_SETTLE_MS;
    };

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      if (Math.abs(t.clientX - startX) > MOVE_TOLERANCE_PX || Math.abs(t.clientY - startY) > MOVE_TOLERANCE_PX) {
        suspicious = true;
      }
    };

    const onTouchEnd = () => {
      touching = false;
      touchEndedAt = performance.now();
    };

    const onClick = (e: MouseEvent) => {
      if (!suspicious) return;
      if (performance.now() - touchEndedAt > CLICK_AFTER_TOUCH_MS) return;
      // 押して移る要素（リンク・ボタン）だけを止める。入力欄などはそのまま
      const target = e.target as Element | null;
      if (!target?.closest?.("a[href], button, [role='button'], [role='tab'], [role='link']")) return;
      suspicious = false;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    };

    // scroll はページ以外（横スクロールの列など）も拾うため capture で受ける
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    window.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });
    window.addEventListener("touchmove", onTouchMove, { capture: true, passive: true });
    window.addEventListener("touchend", onTouchEnd, { capture: true, passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { capture: true, passive: true });
    window.addEventListener("click", onClick, { capture: true });
    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("touchstart", onTouchStart, { capture: true });
      window.removeEventListener("touchmove", onTouchMove, { capture: true });
      window.removeEventListener("touchend", onTouchEnd, { capture: true });
      window.removeEventListener("touchcancel", onTouchEnd, { capture: true });
      window.removeEventListener("click", onClick, { capture: true });
    };
  }, []);

  return null;
}
