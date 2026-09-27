"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { NATIVE_AUTH_CALLBACK, safeInAppPath } from "@/lib/native/app-shell";

function paramsFromCallback(url: string): URLSearchParams | null {
  if (url.startsWith("jp.machiglyph.app://")) {
    const query = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
    return new URLSearchParams(query.split("#")[0]);
  }
  try {
    const parsed = new URL(url);
    const hostOk = parsed.hostname === "www.machiglyph.jp" || parsed.hostname === "machiglyph.jp";
    if (hostOk && parsed.pathname.startsWith("/auth/callback")) {
      return parsed.searchParams;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * アプリのカスタム URL から戻り、OAuth の code をセッションに交換する。
 * ブラウザでは何もしない。
 */
export function NativeAppBridge() {
  useEffect(() => {
    let remove: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform() || cancelled) return;
      const { App } = await import("@capacitor/app");
      const { Browser } = await import("@capacitor/browser");
      const handle = await App.addListener("appUrlOpen", async ({ url }) => {
        if (!url.startsWith(NATIVE_AUTH_CALLBACK) && !url.includes("/auth/callback")) return;
        await Browser.close().catch(() => undefined);
        const params = paramsFromCallback(url);
        if (!params) return;
        if (params.get("error")) {
          window.location.assign("/auth/error");
          return;
        }
        const code = params.get("code");
        const next = safeInAppPath(params.get("next"));
        if (!code) {
          window.location.assign(next);
          return;
        }
        const supabase = createClient();
        if (!supabase) {
          window.location.assign("/auth/error");
          return;
        }
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        window.location.assign(error ? "/auth/error" : next);
      });
      if (cancelled) {
        await handle.remove();
        return;
      }
      remove = () => {
        void handle.remove();
      };
    })();

    return () => {
      cancelled = true;
      remove?.();
    };
  }, []);

  return null;
}
