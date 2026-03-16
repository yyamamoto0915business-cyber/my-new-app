"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { useSupabaseUser } from "@/hooks/use-supabase-user";

const ORGANIZER_STORAGE_KEYS = [
  "user",
  "profile",
  "role",
  "organizer",
  "organizer_profile",
  "access_token",
  "refresh_token",
  "profile-dashboard-tab",
];

function clearOrganizerStorage() {
  if (typeof window === "undefined") return;
  ORGANIZER_STORAGE_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  });
}

/** 主催者ヘッダー右上の開発者ボタン（developer_admin のみ表示） */
export function OrganizerAccountMenu() {
  const router = useRouter();
  const { user } = useSupabaseUser();
  const [isDeveloperAdmin, setIsDeveloperAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsDeveloperAdmin(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setIsDeveloperAdmin(Boolean(data.isDeveloperAdmin));
        }
      } catch {
        if (!cancelled) setIsDeveloperAdmin(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // developer_admin 以外のユーザーには何も表示しない
  if (!isDeveloperAdmin) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => router.push("/admin")}
      className="inline-flex h-9 min-h-[40px] shrink-0 items-center gap-2 rounded-full border border-zinc-200/90 bg-white/95 px-2.5 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:border-zinc-300/80 hover:bg-zinc-50 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mg-accent)]/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-600/90 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:border-zinc-500/80 dark:hover:bg-zinc-700/80 dark:hover:text-zinc-100 sm:h-10 sm:min-h-0 sm:px-3"
      aria-label="開発者管理画面を開く"
    >
      <span className="hidden max-w-[140px] truncate sm:inline">developer</span>
      <Shield className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" aria-hidden />
    </button>
  );
}
