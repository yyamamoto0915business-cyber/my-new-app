"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { createClient } from "@/lib/supabase/client";
import { CommonAvatar } from "@/components/profile/common-avatar";
import {
  resolveAvatarUrlByRole,
  resolveProfileDisplayName,
  type ProfileAvatarRole,
} from "@/lib/profile-avatar";
import { isAdmin } from "@/lib/admin";

function isMissingAvatarColumnsError(message: string): boolean {
  return /participant_avatar_url|organizer_avatar_url|active_profile_role|42703/i.test(
    message
  );
}

const NAV_LINKS = [
  { label: "探す", href: "/" },
  { label: "ストーリー", href: "/stories" },
  { label: "ボランティア", href: "/volunteer" },
  { label: "主催", href: "/organizer" },
] as const;

function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/events");
  return pathname.startsWith(href);
}

export function PcTopNav() {
  const pathname = usePathname() ?? "";
  const { user } = useSupabaseUser();
  const [activeProfileRole, setActiveProfileRole] =
    useState<ProfileAvatarRole>("participant");
  const [participantAvatarUrl, setParticipantAvatarUrl] = useState<string | null>(null);
  const [organizerAvatarUrl, setOrganizerAvatarUrl] = useState<string | null>(null);
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const supabase = createClient();
    if (!supabase) return;
    let cancelled = false;

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, participant_avatar_url, organizer_avatar_url, active_profile_role")
        .eq("id", user.id)
        .maybeSingle();
      let resolved = data;
      if (error && isMissingAvatarColumnsError(error.message ?? "")) {
        const { data: legacy } = await supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("id", user.id)
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
  }, [user?.id]);

  const displayName = user
    ? resolveProfileDisplayName(
        {
          display_name:
            profileDisplayName ??
            ((user.user_metadata?.display_name as string) ??
              (user.user_metadata?.name as string) ??
              null),
          email: user.email ?? null,
        },
        "アカウント"
      )
    : null;

  const avatarUrl = resolveAvatarUrlByRole(
    {
      participant_avatar_url: participantAvatarUrl,
      organizer_avatar_url: organizerAvatarUrl,
    },
    activeProfileRole
  );

  return (
    <header className="fixed left-0 right-0 top-0 z-[100] hidden h-[var(--mg-pc-top-nav-h)] min-h-[var(--mg-pc-top-nav-h)] items-center gap-4 border-b border-[#c8dcd0] bg-[#f4faf6]/98 px-7 backdrop-blur-sm min-[900px]:left-20 min-[900px]:flex">
      {/* Logo */}
      <Link
        href="/"
        className="mr-3 shrink-0 whitespace-nowrap text-[18px] font-semibold tracking-[0.05em] text-[#0e1610]"
        style={{ fontFamily: "'Shippori Mincho', serif" }}
        aria-label="MachiGlyph ホームへ"
      >
        MachiGlyph
      </Link>

      {/* Nav links */}
      <nav className="flex items-center gap-1" aria-label="メインナビゲーション">
        {NAV_LINKS.map((link) => {
          const active = isNavActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-[20px] px-[12px] py-[5px] text-[13px] font-medium transition-colors ${
                active
                  ? "bg-[#1e3848] text-[#f4faf6]"
                  : "text-[#3a5848] hover:text-[#1e3828]"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User menu */}
      {user ? (
        <div className="flex items-center gap-2">
          {isAdmin(user.email) && (
            <Link
              href="/admin"
              style={{
                padding: "3px 10px",
                borderRadius: 20,
                fontSize: 10,
                background: "#1e3848",
                color: "#70c8e0",
                fontWeight: 500,
                whiteSpace: "nowrap",
                textDecoration: "none",
              }}
            >
              🔐 管理者
            </Link>
          )}
          <span className="whitespace-nowrap text-[13px] text-[#3a5848]">
            {displayName}
          </span>
          <Link
            href="/profile"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#1e3848] bg-[#eef4f6]"
            aria-label="マイページへ"
          >
            <CommonAvatar
              avatarUrl={avatarUrl}
              displayName={displayName ?? "アカウント"}
              size="sm"
              className="h-7 w-7 border border-[#1e3848]/20 bg-[#eef4f6]"
              initialsClassName="text-[#1e3848]"
            />
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Link
            href="/auth"
            className="whitespace-nowrap rounded-[20px] border border-[#c8dcd0] bg-transparent px-[14px] py-[6px] text-[13px] font-medium text-[#1e3828] transition hover:bg-[#ecf6ee]"
          >
            ログイン
          </Link>
          <Link
            href="/auth"
            className="whitespace-nowrap rounded-[20px] bg-[#1e3848] px-[14px] py-[6px] text-[13px] font-medium text-[#f4f0e8] transition hover:opacity-90"
          >
            新規登録
          </Link>
        </div>
      )}
    </header>
  );
}
