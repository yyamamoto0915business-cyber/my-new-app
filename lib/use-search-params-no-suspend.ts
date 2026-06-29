"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const listeners = new Set<() => void>();
let historyPatched = false;

function scheduleNotify() {
  queueMicrotask(() => {
    listeners.forEach((listener) => listener());
  });
}

/** router.push / replace でも search が同期（React のレンダー中に setState しない） */
function ensureHistoryPatched() {
  if (historyPatched || typeof window === "undefined") return;
  historyPatched = true;

  window.addEventListener("popstate", scheduleNotify);

  const originalPush = history.pushState.bind(history);
  const originalReplace = history.replaceState.bind(history);

  history.pushState = (...args) => {
    originalPush(...args);
    scheduleNotify();
  };
  history.replaceState = (...args) => {
    originalReplace(...args);
    scheduleNotify();
  };
}

function subscribeToSearchParams(onChange: () => void) {
  ensureHistoryPatched();
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

/**
 * useSearchParamsの代替（Suspenseなし）。
 * SSR では空。クライアントはマウント後に URL と同期（hydration 安全）。
 */
export function useSearchParamsNoSuspend(): URLSearchParams {
  const pathname = usePathname();
  const [params, setParams] = useState<URLSearchParams>(() => new URLSearchParams());

  useEffect(() => {
    const sync = () => setParams(new URLSearchParams(window.location.search));
    sync();
    return subscribeToSearchParams(sync);
  }, [pathname]);

  return params;
}
