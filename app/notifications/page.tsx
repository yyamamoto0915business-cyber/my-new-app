"use client";

import { useEffect, useState } from "react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { ProfileEmptyCard } from "@/components/profile/profile-empty-card";
import { getLoginUrl } from "@/lib/auth-utils";
import {
  NotificationsView,
  type NotificationItem,
  type PendingFormItem,
  type PendingFollowItem,
} from "@/components/notifications/NotificationsView";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [pendingForms, setPendingForms] = useState<PendingFormItem[]>([]);
  const [pendingFollows, setPendingFollows] = useState<PendingFollowItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const { user, loading: authLoading } = useSupabaseUser();

  const loginHref = getLoginUrl("/notifications");

  const load = async () => {
    if (!user) {
      setAuthRequired(true);
      setLoading(false);
      return;
    }
    try {
      const res = await fetchWithTimeout("/api/notifications");
      if (res.status === 401) {
        setAuthRequired(true);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
        setPendingForms(data.pendingApplicationForms ?? []);
        setPendingFollows(data.pendingFollowRequests ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setAuthRequired(false);
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    if (res.ok) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  };

  const handleMarkAllAsRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      const res = await fetch("/api/notifications/read-all", { method: "POST" });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } finally {
      setMarkingAll(false);
    }
  };

  const handleRespondFollow = async (
    followId: string,
    action: "accept" | "reject",
  ) => {
    const res = await fetch(`/api/follows/${followId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      setPendingFollows((prev) => prev.filter((f) => f.followId !== followId));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8f5]">
        <p className="text-sm text-[#6b7569]">読み込み中...</p>
      </div>
    );
  }

  if (authRequired) {
    return (
      <div className="min-h-screen bg-[#f7f8f5] px-4">
        <div className="mx-auto max-w-md pt-12">
          <ProfileEmptyCard
            title="ログインが必要です"
            description="お知らせを利用するにはログインしてください"
            ctaLabel="ログイン"
            ctaHref={loginHref}
          />
        </div>
      </div>
    );
  }

  return (
    <NotificationsView
      notifications={notifications}
      pendingForms={pendingForms}
      pendingFollows={pendingFollows}
      unreadCount={unreadCount}
      onMarkAsRead={handleMarkAsRead}
      onMarkAllAsRead={handleMarkAllAsRead}
      onRespondFollow={handleRespondFollow}
      markingAll={markingAll}
    />
  );
}
