/**
 * イベント詳細：ヘッダー＋タブの sticky ラッパー
 * - `sticky top-0` + `pt-[env(safe-area-inset-top)]` でノッチ下にコンテンツを置き、スクロール時も重なりにくくする
 */
export const MOBILE_EVENT_STICKY_SHELL =
  "sticky top-0 z-30 -mx-4 border-b border-[var(--mg-line)] bg-white/95 backdrop-blur-sm pt-[env(safe-area-inset-top,0px)] sm:mx-0 sm:pt-0";
