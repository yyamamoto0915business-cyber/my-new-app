"use client";

import { useEffect } from "react";
import { useSupabaseUser } from "@/hooks/use-supabase-user";

/**
 * ログイン済みの iOS アプリで通知許可を取り、端末トークンを保存する。
 */
export function PushRegistration() {
  const { user, loading } = useSupabaseUser();

  useEffect(() => {
    if (loading || !user) return;
    let remove: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios" || cancelled) return;
      const { PushNotifications } = await import("@capacitor/push-notifications");
      const permission = await PushNotifications.requestPermissions();
      if (permission.receive !== "granted" || cancelled) return;
      await PushNotifications.register();
      const registration = await PushNotifications.addListener("registration", (token) => {
        void fetch("/api/me/push-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: token.value }),
        });
      });
      const opened = await PushNotifications.addListener(
        "pushNotificationActionPerformed",
        (action) => {
          const link = action.notification.data?.link;
          if (typeof link === "string" && link.startsWith("/") && !link.startsWith("//")) {
            window.location.assign(link);
          }
        }
      );
      if (cancelled) {
        await registration.remove();
        await opened.remove();
        return;
      }
      remove = () => {
        void registration.remove();
        void opened.remove();
      };
    })().catch((err) => {
      console.warn("[push] register failed", err);
    });

    return () => {
      cancelled = true;
      remove?.();
    };
  }, [loading, user]);

  return null;
}
