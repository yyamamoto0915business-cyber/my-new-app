"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * useSearchParamsの代替（Suspenseなし）。
 * クライアントでURLを読み取り、サスペンドを防ぐ。
 * 戻る/進むでは pathname が同じケースもあるため popstate でも search を同期する。
 */
export function useSearchParamsNoSuspend(): URLSearchParams {
  const pathname = usePathname();
  const [params, setParams] = useState<URLSearchParams>(() =>
    typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search)
  );
  useEffect(() => {
    const sync = () => setParams(new URLSearchParams(window.location.search));
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [pathname]);
  return params;
}
