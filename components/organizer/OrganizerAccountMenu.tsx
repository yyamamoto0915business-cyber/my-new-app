"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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

/** 主催者用アカウントメニュー（右上プロフィールメニュー内にログアウト） */
export function OrganizerAccountMenu() {
  const router = useRouter();
  const { user } = useSupabaseUser();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName =
    (user?.user_metadata?.display_name as string) ??
    (user?.user_metadata?.name as string) ??
    user?.email?.split("@")[0] ??
    "アカウント";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      const supabase = createClient();
      if (!supabase) throw new Error("Supabase not configured");
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      clearOrganizerStorage();
      setOpen(false);
      router.replace("/login");
      router.refresh();
    } catch {
      alert("ログアウトに失敗しました");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[44px] items-center gap-2 rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="アカウントメニュー"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-8 w-8 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-600 dark:bg-zinc-600 dark:text-zinc-300"
            aria-hidden
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </span>
        )}
        <span className="hidden max-w-[120px] truncate sm:inline">{displayName}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-xl border border-[var(--border)] bg-white py-1 shadow-lg dark:border-zinc-600 dark:bg-zinc-900"
          role="menu"
        >
          <div className="px-3 py-2">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">アカウント情報</p>
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {displayName}
            </p>
            {user?.email && (
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
            )}
          </div>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex min-h-[44px] items-center px-3 py-2.5 text-sm text-zinc-700 transition hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
            role="menuitem"
          >
            マイページへ
          </Link>
          <div className="my-1 border-t border-[var(--border)] dark:border-zinc-600" />
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex min-h-[44px] w-full items-center px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40"
            role="menuitem"
          >
            {loggingOut ? "ログアウト中..." : "ログアウト"}
          </button>
        </div>
      )}
    </div>
  );
}
