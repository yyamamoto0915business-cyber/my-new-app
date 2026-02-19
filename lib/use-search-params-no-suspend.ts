"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * useSearchParamsの代替（Suspenseなし）。
 * クライアントでURLを読み取り、サスペンドを防ぐ。
 */
export function useSearchParamsNoSuspend(): URLSearchParams {
  const pathname = usePathname();
  const [params, setParams] = useState<URLSearchParams>(() =>
    typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search)
  );
  useEffect(() => {
    setParams(new URLSearchParams(window.location.search));
  }, [pathname]);
  return params;
}
