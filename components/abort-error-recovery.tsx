"use client";

import { isAbortLikeError, isNetworkFetchError } from "@/lib/is-abort-like-error";

function swallowIfBenign(reason: unknown): boolean {
  return isAbortLikeError(reason) || isNetworkFetchError(reason);
}

function installTouchActiveSupport() {
  if (typeof window === "undefined") return;

  const w = window as Window & { __mgTouchActiveInstalled?: boolean };
  if (w.__mgTouchActiveInstalled) return;
  w.__mgTouchActiveInstalled = true;

  // iOS Safari でリンク等の :active を有効にする
  document.addEventListener("touchstart", () => {}, { passive: true });
}

function installAbortErrorRecovery() {
  if (typeof window === "undefined") return;

  const w = window as Window & { __mgAbortRecoveryInstalled?: boolean };
  if (w.__mgAbortRecoveryInstalled) return;
  w.__mgAbortRecoveryInstalled = true;

  installTouchActiveSupport();

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    if (swallowIfBenign(event.reason)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };

  const onError = (event: ErrorEvent) => {
    if (swallowIfBenign(event.error)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };

  // Next.js 開発オーバーレイは console.error(AbortError) でも表示する
  const originalConsoleError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    if (args.some((arg) => swallowIfBenign(arg))) {
      console.warn(...args);
      return;
    }
    originalConsoleError(...args);
  };

  window.addEventListener("unhandledrejection", onUnhandledRejection, true);
  window.addEventListener("error", onError, true);
}

installAbortErrorRecovery();

/** 遷移で中断された fetch の未処理拒否がエラー画面に出ないよう抑止する */
export function AbortErrorRecovery() {
  installAbortErrorRecovery();
  return null;
}
