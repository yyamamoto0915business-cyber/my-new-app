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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommonAvatar } from "@/components/profile/common-avatar";
import {
  resolveAvatarUrlByRole,
  resolveProfileDisplayName,
  type ProfileAvatarRole,
} from "@/lib/profile-avatar";

function isMissingAvatarColumnsError(message: string): boolean {
  return /participant_avatar_url|organizer_avatar_url|active_profile_role|42703/i.test(
    message
  );
}

/** ログイン中ユーザー向けアカウントメニュー。developer_admin のみ「開発者管理画面」を表示 */
export function UserMenu() {
  const router = useRouter();
  const { user, loading } = useSupabaseUser();
  const userId = user?.id ?? null;
  const [isDeveloperAdmin, setIsDeveloperAdmin] = useState(false);
  const [menuLoading, setMenuLoading] = useState(false);
  const [activeProfileRole, setActiveProfileRole] =
    useState<ProfileAvatarRole>("participant");
  const [participantAvatarUrl, setParticipantAvatarUrl] = useState<string | null>(null);
  const [organizerAvatarUrl, setOrganizerAvatarUrl] = useState<string | null>(null);
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
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
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    if (!supabase) return;
    let cancelled = false;
    const loadProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, participant_avatar_url, organizer_avatar_url, active_profile_role")
        .eq("id", userId)
        .maybeSingle();
      let resolved = data;
      if (error && isMissingAvatarColumnsError(error.message ?? "")) {
        const { data: legacy } = await supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("id", userId)
          .maybeSingle();
        resolved = legacy
          ? {
              ...legacy,
              participant_avatar_url: legacy.avatar_url ?? null,
              organizer_avatar_url: null,
              active_profile_role: "participant",
            }
          : null;
      }
      if (cancelled || !resolved) return;
      setProfileDisplayName(resolved.display_name ?? null);
      setParticipantAvatarUrl(resolved.participant_avatar_url ?? resolved.avatar_url ?? null);
      setOrganizerAvatarUrl(resolved.organizer_avatar_url ?? null);
      setActiveProfileRole(
        resolved.active_profile_role === "organizer" ? "organizer" : "participant"
      );
    };
    loadProfile();
    const handleProfileUpdated = () => {
      loadProfile();
    };
    window.addEventListener("mg:profile-avatar-updated", handleProfileUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener("mg:profile-avatar-updated", handleProfileUpdated);
    };
  }, [userId]);

  const handleLogout = async () => {
    try {
      setMenuLoading(true);
      const supabase = createClient();
      if (!supabase) throw new Error("Supabase not configured");
      await supabase.auth.signOut();
      router.replace("/auth");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setMenuLoading(false);
    }
  };

  if (loading || !user) {
    return null;
  }

  const displayName = resolveProfileDisplayName(
    {
      display_name:
        profileDisplayName ??
        ((user.user_metadata?.display_name as string) ??
          (user.user_metadata?.name as string) ??
          null),
      email: user.email ?? null,
    },
    "アカウント"
  );
  const avatarUrl = resolveAvatarUrlByRole(
    {
      participant_avatar_url: participantAvatarUrl,
      organizer_avatar_url: organizerAvatarUrl,
    },
    activeProfileRole
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="inline-flex h-9 min-h-[40px] shrink-0 items-center justify-center rounded-full border border-zinc-200/90 bg-white/95 px-2.5 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:border-zinc-300/80 hover:bg-zinc-50 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mg-accent)]/30 focus-visible:ring-offset-2 dark:border-zinc-600/90 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:border-zinc-500/80 dark:hover:bg-zinc-700/80 dark:hover:text-zinc-100"
            aria-label="アカウントメニュー"
          >
            <span className="inline-flex h-7 w-7 shrink-0" aria-hidden>
              <CommonAvatar
                avatarUrl={avatarUrl}
                displayName={displayName}
                size="sm"
                className="h-7 w-7 border border-zinc-200/70 bg-zinc-100/90"
              />
            </span>
          </button>
        }
      />

      <DropdownMenuContent
        align="end"
        className="w-[240px] rounded-2xl border border-zinc-200/90 bg-white p-2.5 py-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        sideOffset={8}
      >
        <div className="cursor-default border-0 px-3 py-2 text-left">
          <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            {displayName}
          </div>
          <div className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
            {user.email ?? "ログイン中"}
          </div>
        </div>

        <DropdownMenuSeparator className="my-1.5" />

        {isDeveloperAdmin && (
          <>
            <a
              href="/admin"
              className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-zinc-700 outline-none transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus:bg-zinc-100 focus:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:focus:bg-zinc-800 dark:focus:text-zinc-100"
            >
              <Shield className="h-4 w-4 shrink-0" />
              <span>開発者管理画面</span>
            </a>
            <DropdownMenuSeparator className="my-1.5" />
          </>
        )}

        <a
          href="/profile"
          className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-zinc-700 outline-none transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus:bg-zinc-100 focus:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:focus:bg-zinc-800 dark:focus:text-zinc-100"
        >
          <User className="h-4 w-4 shrink-0" />
          <span>マイページ</span>
        </a>

        <DropdownMenuSeparator className="my-1.5" />

        <DropdownMenuItem
          variant="destructive"
          onClick={handleLogout}
          disabled={menuLoading}
          className="min-h-[44px] cursor-pointer rounded-xl px-3 py-2.5 text-red-600 focus:bg-red-50 focus:text-red-600 dark:text-red-400 dark:focus:bg-red-950/40 dark:focus:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          <span>{menuLoading ? "ログアウト中..." : "ログアウト"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
