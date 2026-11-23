"use client";

import { use, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * 画面の移り変わりをアプリらしくする（View Transitions。iOS 18・新しい Chrome など）。
 * - リンクで進む：新しい画面が右から少し滑りこむ
 * - 戻る（戻るボタン・スワイプ）：左から滑りこむ
 * - 下のメニュー（タブ）：ふわっと切りかわる
 * 上の帯・下のメニューは動かさない（globals.css の view-transition-name）。
 * 使えない端末・「視差効果を減らす」の設定では何もしない（今までどおりすぐ切りかわる）。
 *
 * しくみ：押した瞬間に「関所」を立て、新しい画面の描き出しを止める（NavCommitGate が待つ）。
 * ブラウザが前の画面を写したら関所を開けて、新しい画面を描かせる。
 * こうしないと、写す前に新しい画面が出てしまい、動きが出せなかった。
 */

type Kind = "forward" | "back" | "tab";

type ViewTransitionLike = { skipTransition?: () => void; finished: Promise<void> };
type DocWithVT = Document & { startViewTransition?: (cb: () => Promise<void>) => ViewTransitionLike };

/** 新しい画面が出るのをこれ以上は待たない（遅い回線で画面が止まって見えないように） */
const WAIT_MS = 450;
/** 前の画面を写すのを待つ上限（写せない状態のときに止まり続けないように） */
const GATE_MAX_MS = 300;

let gate: { promise: Promise<void>; open: () => void } | null = null;

function openGate() {
  const g = gate;
  gate = null;
  g?.open();
}

/** 関所が立っているあいだ、新しい画面の描き出しを待たせる（画面が変わるたびに描き直される） */
export function NavCommitGate() {
  usePathname();
  const g = gate;
  if (g) use(g.promise);
  return null;
}

export function PageTransitions() {
  const pathname = usePathname();
  const pending = useRef<{ resolve: () => void; vt: ViewTransitionLike; timer: number } | null>(null);

  // 画面が変わったら、待っていた移り変わりを進める
  useEffect(() => {
    const p = pending.current;
    if (!p) return;
    pending.current = null;
    window.clearTimeout(p.timer);
    p.resolve();
  }, [pathname]);

  useEffect(() => {
    const doc = document as DocWithVT;
    if (typeof doc.startViewTransition !== "function") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    const start = (kind: Kind) => {
      if (reduce.matches || pending.current || gate) return;
      const root = document.documentElement;
      root.dataset.mgVt = kind;

      let open!: () => void;
      const promise = new Promise<void>((r) => (open = r));
      gate = { promise, open };
      const gateTimer = window.setTimeout(openGate, GATE_MAX_MS);

      let resolve!: () => void;
      const ready = new Promise<void>((r) => (resolve = r));
      let vt: ViewTransitionLike;
      try {
        vt = doc.startViewTransition!(() => {
          // 前の画面は写し終わった。新しい画面を描かせて、出るまで待つ
          window.clearTimeout(gateTimer);
          openGate();
          return ready;
        });
      } catch {
        window.clearTimeout(gateTimer);
        openGate();
        delete root.dataset.mgVt;
        return;
      }
      const timer = window.setTimeout(() => {
        // 画面が変わらなかった・遅い：動きはやめて、そのまま出す
        if (pending.current?.vt === vt) pending.current = null;
        vt.skipTransition?.();
        resolve();
      }, WAIT_MS);
      pending.current = { resolve, vt, timer };
      vt.finished
        .catch(() => {})
        .finally(() => {
          window.clearTimeout(gateTimer);
          openGate();
          if (root.dataset.mgVt === kind) delete root.dataset.mgVt;
        });
    };

    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      // ゲーム・API など、画面ぜんたいを使う所・画面でない所は動かさない
      if (url.pathname.startsWith("/play/") || url.pathname.startsWith("/api/")) return;
      const tab = Boolean(anchor.closest('[data-mg-chrome="mobile-bottom"], [data-mg-chrome="pc-rail"]'));
      start(tab ? "tab" : "forward");
    };

    const onPop = () => start("back");
    const popOptions = { capture: true } as const;

    // React の処理より先に動かす（押した瞬間の画面を写すため）
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop, popOptions);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop, popOptions);
    };
  }, []);

  return null;
}
