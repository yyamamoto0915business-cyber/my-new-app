"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { createClient } from "@/lib/supabase/client";
import { CommonAvatar } from "@/components/profile/common-avatar";
import { NotificationBell } from "@/components/notification-bell";
import {
  resolveAvatarUrlByRole,
  resolveProfileDisplayName,
  type ProfileAvatarRole,
} from "@/lib/profile-avatar";
import { isAdmin } from "@/lib/admin";
import { useOrganizerPro } from "@/lib/organizer-pro-store";
import { isDiscoverPath } from "@/lib/top-mode-active";
import { Search } from "lucide-react";
import { setModeCookie } from "@/lib/mode-preference";
import { shouldHidePcGlobalNav } from "@/lib/is-auth-route";
import { ParticipationPassIcon } from "@/components/pass/ParticipationPassIcon";

function isMissingAvatarColumnsError(message: string): boolean {
  return /participant_avatar_url|organizer_avatar_url|active_profile_role|42703/i.test(
    message
  );
}

const NAV_LINKS = [
  { label: "探す", href: "/", icon: "search" as const },
  { label: "ボランティア", href: "/volunteer", icon: null },
  { label: "主催", href: "/organizer", icon: null },
] as const;

function isNavActive(pathname: string, href: string) {
  if (href === "/organizer") return pathname.startsWith("/organizer");
  if (href === "/volunteer") return pathname.startsWith("/volunteer");
  if (href === "/pass") return pathname.startsWith("/pass");
  if (href === "/") return isDiscoverPath(pathname);
  return pathname.startsWith(href);
}

function syncModeCookieForNav(href: string) {
  if (href === "/organizer") setModeCookie("ORGANIZER");
  else if (href === "/volunteer") setModeCookie("VOLUNTEER");
  else if (href === "/") setModeCookie("EVENT");
}

const AUTH_RETURN_KEYS = ["next", "returnTo", "redirect", "callbackUrl"] as const;

function buildAuthHref(tab: "login" | "signup", searchParams: URLSearchParams): string {
  const params = new URLSearchParams();
  for (const key of AUTH_RETURN_KEYS) {
    const value = searchParams.get(key);
    if (value) params.set(key, value);
  }
  if (tab === "signup") params.set("tab", "signup");
  const qs = params.toString();
  return qs ? `/auth?${qs}` : "/auth";
}

function PcAuthNavButtons() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const onAuth = pathname === "/auth";
  const isSignupTab = onAuth && searchParams.get("tab") === "signup";
  const loginHref = buildAuthHref("login", searchParams);
  const signupHref = buildAuthHref("signup", searchParams);

  return (
    <>
      <Link
        href={loginHref}
        aria-current={onAuth && !isSignupTab ? "page" : undefined}
        className={`whitespace-nowrap rounded-[20px] border px-[14px] py-[6px] text-[13px] font-medium transition ${
          onAuth && !isSignupTab
            ? "border-[#1e3848] bg-[#ecf6ee] text-[#1e3848]"
            : "border-[#c8dcd0] bg-transparent text-[#1e3828] hover:bg-[#ecf6ee]"
        }`}
      >
        ログイン
      </Link>
      <Link
        href={signupHref}
        aria-current={isSignupTab ? "page" : undefined}
        className={`whitespace-nowrap rounded-[20px] px-[14px] py-[6px] text-[13px] font-medium transition ${
          isSignupTab
            ? "bg-[#1e3848] text-[#f4f0e8] ring-2 ring-[#1e3848]/25"
            : "bg-[#1e3848] text-[#f4f0e8] hover:opacity-90"
        }`}
      >
        新規登録
      </Link>
    </>
  );
}

export function PcTopNav() {
  const pathname = usePathname() ?? "";
  if (shouldHidePcGlobalNav(pathname)) return null;
  return <PcTopNavInner />;
}

function PcTopNavInner() {
  const pathname = usePathname() ?? "";
  const { user } = useSupabaseUser();
  const isProOrganizer = useOrganizerPro();
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
      active_profile_role: activeProfileRole,
    },
    activeProfileRole
  );

  return (
    <header className="fixed left-0 right-0 top-0 z-[100] hidden h-[var(--mg-pc-top-nav-h)] min-h-[var(--mg-pc-top-nav-h)] items-center gap-4 border-b border-[#e8ebe6] bg-[#ffffff] px-7 min-[900px]:left-20 min-[900px]:flex">
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
          const isPaidOrganizerLink =
            link.href === "/organizer" && isProOrganizer;

          if (isPaidOrganizerLink) {
            return (
              <span
                key={link.href}
                className="relative z-10 inline-block overflow-visible"
              >
                <Link
                  href={link.href}
                  prefetch
                  className={
                    active
                      ? "org-tab-pro-shiny"
                      : "whitespace-nowrap rounded-[20px] px-[12px] py-[5px] text-[13px] font-medium text-[#3a5848] transition-colors hover:text-[#1e3828]"
                  }
                  aria-current={active ? "page" : undefined}
                  onClick={() => syncModeCookieForNav(link.href)}
                >
                  {link.label}
                </Link>
                <span className="org-pro-tab-badge">PRO</span>
                {active ? (
                  <>
                    <span className="org-pro-star org-pro-star-1" aria-hidden />
                    <span className="org-pro-star org-pro-star-2" aria-hidden />
                    <span className="org-pro-star org-pro-star-3" aria-hidden />
                  </>
                ) : null}
              </span>
            );
          }

          return (
            <Link
              key={link.href}
              href={link.href}
              prefetch
              onClick={() => syncModeCookieForNav(link.href)}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-[20px] px-[14px] py-[6px] text-[13px] font-medium transition-colors ${
                active
                  ? "bg-[#1a2b3c] text-white"
                  : "text-[#3d5c48] hover:bg-[#f4f6f4]"
              }`}
            >
              {link.icon === "search" && (
                <Search className="h-3.5 w-3.5" aria-hidden />
              )}
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* 右側: 参加パス・通知・ユーザー */}
      <div className="flex items-center gap-2">
        <Link
          href="/pass"
          className="inline-flex h-9 items-center gap-1.5 rounded-[20px] border border-[#c8dcd0] bg-white px-3.5 text-[13px] font-medium text-[#1e3848] transition hover:bg-[#ecf6ee]"
        >
          <ParticipationPassIcon className="h-[22px] w-[22px]" stroke="currentColor" />
          参加パス
        </Link>
        <Suspense fallback={null}>
          <NotificationBell showLabel />
        </Suspense>
        {user ? (
          <>
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
          </>
        ) : (
          <Suspense
            fallback={
              <>
                <span className="inline-flex h-[34px] w-[72px] rounded-[20px] border border-[#c8dcd0]" aria-hidden />
                <span className="inline-flex h-[34px] w-[88px] rounded-[20px] bg-[#1e3848]/80" aria-hidden />
              </>
            }
          >
            <PcAuthNavButtons />
          </Suspense>
        )}
      </div>
    </header>
  );
}
