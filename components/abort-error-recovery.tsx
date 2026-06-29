"use client";

import { useEffect } from "react";
import { isAbortLikeError, isNetworkFetchError } from "@/lib/is-abort-like-error";

/** 遷移で中断された fetch の未処理拒否がエラー画面に出ないよう抑止する */
export function AbortErrorRecovery() {
  useEffect(() => {
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isAbortLikeError(event.reason) || isNetworkFetchError(event.reason)) {
        event.preventDefault();
      }
    };
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => window.removeEventListener("unhandledrejection", onUnhandledRejection);
  }, []);

  return null;
}
