"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/use-supabase-user";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

/** 主催者用アカウントメニュー（MachiGlyph 風・上品でやわらかいUI） */
export function OrganizerAccountMenu() {
  const router = useRouter();
  const { user } = useSupabaseUser();
  const [loading, setLoading] = useState(false);
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

  const displayEmail = user?.email ?? null;

  const handleLogout = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      if (!supabase) throw new Error("Supabase not configured");
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      clearOrganizerStorage();
      router.replace("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
      alert("ログアウトに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="inline-flex h-9 min-h-[40px] shrink-0 items-center gap-2 rounded-full border border-zinc-200/90 bg-white/95 px-2.5 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:border-zinc-300/80 hover:bg-zinc-50 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mg-accent)]/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-600/90 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:border-zinc-500/80 dark:hover:bg-zinc-700/80 dark:hover:text-zinc-100 sm:h-10 sm:min-h-0 sm:px-3"
            aria-label="アカウントメニュー"
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100/90 text-xs font-semibold text-zinc-600 dark:bg-zinc-700/90 dark:text-zinc-300"
              aria-hidden
            >
              主
            </span>
            <span className="hidden max-w-[100px] truncate sm:inline">アカウント</span>
          </button>
        }
      />

      <DropdownMenuContent
        align="end"
        className="w-[240px] rounded-2xl border border-zinc-200/90 bg-white p-2.5 py-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        sideOffset={8}
      >
        <DropdownMenuLabel className="cursor-default border-0 px-3 py-2">
          <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            主催者アカウント
          </div>
          <div className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
            {displayEmail ?? "イベント管理メニュー"}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-1.5" />

        {isDeveloperAdmin && (
          <>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                router.push("/admin");
              }}
              className="min-h-[44px] cursor-pointer gap-2 rounded-xl px-3 py-2.5 text-zinc-700 focus:bg-zinc-100 focus:text-zinc-900 dark:text-zinc-300 dark:focus:bg-zinc-800 dark:focus:text-zinc-100"
            >
              <Shield className="h-4 w-4" />
              <span>開発者管理画面</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1.5" />
          </>
        )}

        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            router.push("/profile");
          }}
          className="min-h-[44px] cursor-pointer gap-2 rounded-xl px-3 py-2.5 text-zinc-700 focus:bg-zinc-100 focus:text-zinc-900 dark:text-zinc-300 dark:focus:bg-zinc-800 dark:focus:text-zinc-100"
        >
          <User className="h-4 w-4" />
          <span>アカウント</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1.5" />

        <DropdownMenuItem
          variant="destructive"
          onClick={handleLogout}
          disabled={loading}
          className="min-h-[44px] cursor-pointer rounded-xl px-3 py-2.5 text-red-600 focus:bg-red-50 focus:text-red-600 dark:text-red-400 dark:focus:bg-red-950/40 dark:focus:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          <span>{loading ? "ログアウト中..." : "ログアウト"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
