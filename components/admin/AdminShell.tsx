"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type AdminShellProps = {
  adminEmail: string | null;
  adminRole: string | null;
  adminDisplayName?: string | null;
  children: ReactNode;
};

type NavIconId =
  | "dashboard"
  | "accounts"
  | "reviews"
  | "events"
  | "volunteers"
  | "passes"
  | "support"
  | "settings";

type NavItem = {
  href: string;
  label: string;
  icon: NavIconId;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "ダッシュボード", icon: "dashboard" },
  { href: "/admin/accounts", label: "アカウント管理", icon: "accounts" },
  { href: "/admin/reviews", label: "審査・本人確認", icon: "reviews" },
  { href: "/admin/events", label: "イベント管理", icon: "events" },
  { href: "/admin/volunteers", label: "ボランティア管理", icon: "volunteers" },
  { href: "/admin/passes", label: "参加パス・決済", icon: "passes" },
  { href: "/admin/support", label: "問い合わせ・通報", icon: "support" },
  { href: "/admin/settings", label: "管理ログ・設定", icon: "settings" },
];

function NavIcon({ icon, active }: { icon: NavIconId; active: boolean }) {
  const stroke = active ? "#e0f8f0" : "rgba(255,255,255,0.55)";
  const props = {
    className: "h-4 w-4",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (icon) {
    case "dashboard":
      return (
        <svg {...props}>
          <path d="M3 13h8V3H3v10zM13 21h8v-6h-8v6zM13 3v6h8V3h-8zM3 21h8v-4H3v4z" />
        </svg>
      );
    case "accounts":
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="3" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "reviews":
      return (
        <svg {...props}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case "events":
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      );
    case "volunteers":
      return (
        <svg {...props}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "passes":
      return (
        <svg {...props}>
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
        </svg>
      );
    case "support":
      return (
        <svg {...props}>
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      );
    case "settings":
      return (
        <svg {...props}>
          <path d="M3 4h18M3 9h18M3 14h18M3 19h18M8 4v16" />
        </svg>
      );
  }
}

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="hidden w-52 shrink-0 flex-col overflow-hidden rounded-xl shadow-sm ring-1 ring-[#a8ccb8] lg:flex" style={{ background: "#1e3848" }}>
      <div className="border-b border-white/10 px-3 py-3">
        <div
          className="text-[12px] font-semibold text-white"
          style={{ fontFamily: "var(--font-serif, serif)" }}
        >
          管理者画面
        </div>
        <div className="mt-0.5 text-[10px] tracking-[0.06em] text-white/70">
          MachiGlyph Admin
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 p-1.5" aria-label="管理者メニュー">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-lg px-2 py-2 text-[12px] transition-colors ${
                active
                  ? "bg-[#152836] font-medium text-white"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                  active ? "bg-white/15" : "bg-white/5"
                }`}
              >
                <NavIcon icon={item.icon} active={active} />
              </span>
              <span className="truncate">{item.label}</span>
              {active ? (
                <span className="ml-auto h-3.5 w-0.5 rounded-full bg-[#70c8e0]" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-2">
        <Link
          href="/organizer/listings"
          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          ← 主催者ページへ戻る
        </Link>
      </div>
    </aside>
  );
}

export function AdminShell({
  adminEmail,
  adminRole,
  adminDisplayName,
  children,
}: AdminShellProps) {
  return (
    <div className="min-h-screen" style={{ background: "#eaf2ec" }}>
      <div
        className="sticky top-0 z-[200] flex items-center justify-between gap-3 px-4 py-1.5 text-[10px] tracking-[0.06em]"
        style={{ background: "#1e3848", color: "#e0f0f8" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: "#70c8e0" }}
          />
          <span>管理者モード</span>
        </div>
        <div className="flex min-w-0 items-center gap-2 truncate text-white/80">
          <span className="truncate">
            {adminDisplayName ?? adminEmail ?? "開発者ユーザー"}
          </span>
          <span className="hidden shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-[#70c8e0] sm:inline">
            {adminRole ?? "developer_admin"}
          </span>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-2 py-2 md:px-3 md:py-3 lg:flex-row lg:gap-0">
        <div className="w-full overflow-x-auto rounded-lg bg-[#1e3848] p-1.5 lg:hidden">
          <div className="flex gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-md px-2.5 py-1 text-[11px] text-white/80 hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <AdminSidebar />

        <div
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl shadow-sm ring-1 ring-[#a8ccb8] lg:ml-3"
          style={{ background: "#f4faf6" }}
        >
          <main className="flex-1 overflow-x-hidden px-3 py-3 md:px-5 md:py-4">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
