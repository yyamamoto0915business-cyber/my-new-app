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
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-50/80 text-slate-700 shadow-[0_6px_16px_rgba(15,23,42,0.06)] transition-all duration-200 ease-out hover:bg-white active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mg-accent)]/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-600/70 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-700/70 dark:hover:text-slate-100 sm:h-11 sm:w-auto sm:gap-2 sm:px-3"
      aria-label="開発者管理画面を開く"
    >
      <span className="hidden max-w-[140px] truncate text-sm font-medium sm:inline">developer</span>
      <Shield className="h-5 w-5 shrink-0 text-slate-700 dark:text-slate-300" strokeWidth={2.2} aria-hidden />
    </button>
  );
}
