"use client";

import { useEffect } from "react";
import { isAbortLikeError, isNetworkFetchError } from "@/lib/is-abort-like-error";

/** 遷移で中断された fetch の未処理拒否がエラー画面に出ないよう抑止する */
export function AbortErrorRecovery() {
  useEffect(() => {
    const swallowIfBenign = (reason: unknown) =>
      isAbortLikeError(reason) || isNetworkFetchError(reason);

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (swallowIfBenign(event.reason)) {
        event.preventDefault();
      }
    };

    const onError = (event: ErrorEvent) => {
      if (swallowIfBenign(event.error)) {
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("error", onError);
    };
  }, []);

  return null;
}
