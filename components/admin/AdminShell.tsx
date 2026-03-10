"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type AdminShellProps = {
  adminEmail: string | null;
  adminRole: string | null;
  children: ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  icon: "dashboard" | "organizers" | "logs" | "others";
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "ダッシュボード", icon: "dashboard" },
  { href: "/admin/organizers", label: "主催者一覧", icon: "organizers" },
  { href: "/admin/logs", label: "管理ログ", icon: "logs" },
  { href: "/admin/others", label: "その他管理", icon: "others" },
];

function NavIcon({ icon, active }: { icon: NavItem["icon"]; active: boolean }) {
  const stroke = active ? "var(--mg-accent, #2563eb)" : "currentColor";
  if (icon === "dashboard") {
    return (
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 13h8V3H3v10zM13 21h8v-6h-8v6zM13 3v6h8V3h-8zM3 21h8v-4H3v4z" />
      </svg>
    );
  }
  if (icon === "organizers") {
    return (
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="3" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  if (icon === "logs") {
    return (
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 4h18" />
        <path d="M3 9h18" />
        <path d="M3 14h18" />
        <path d="M3 19h18" />
        <path d="M8 4v16" />
      </svg>
    );
  }
  // others
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15A1.65 1.65 0 0 0 21 13.35 7.86 7.86 0 0 0 21 10.65 1.65 1.65 0 0 0 19.4 9l-1.43-.25a1.65 1.65 0 0 1-1.21-1L16 6.1A1.65 1.65 0 0 0 14.35 5h-2.7A1.65 1.65 0 0 0 10 6.1l-.76 1.62a1.65 1.65 0 0 1-1.21 1L6.6 9A1.65 1.65 0 0 0 5 10.65a7.86 7.86 0 0 0 0 2.7A1.65 1.65 0 0 0 6.6 15l1.43.25a1.65 1.65 0 0 1 1.21 1L10 17.9A1.65 1.65 0 0 0 11.65 19h2.7A1.65 1.65 0 0 0 16 17.9l.76-1.62a1.65 1.65 0 0 1 1.21-1z" />
    </svg>
  );
}

export function AdminShell({ adminEmail, adminRole, children }: AdminShellProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-6xl gap-0 px-3 py-4 md:px-4 md:py-6">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 flex-col rounded-xl bg-white/90 p-3 shadow-sm ring-1 ring-slate-200 md:flex">
          <div className="mb-4 px-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              MachiGlyph
            </div>
            <div className="mt-0.5 text-sm font-semibold text-slate-900">
              開発者管理画面
            </div>
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                    <NavIcon icon={item.icon} active={active} />
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main area */}
        <div className="flex min-h-[calc(100vh-2rem)] flex-1 flex-col rounded-xl bg-white/90 shadow-sm ring-1 ring-slate-200 md:ml-4">
          {/* Header */}
          <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div className="flex flex-col">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Developer Console
              </span>
              <span className="text-sm font-semibold text-slate-900">
                開発者管理画面
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-100">
                <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                developer_admin
              </span>
              <div className="flex flex-col items-end">
                <span className="text-xs font-medium text-slate-900">
                  {adminEmail ?? "開発者ユーザー"}
                </span>
                <span className="text-[11px] text-slate-400">
                  {adminRole ?? "developer_admin"}
                </span>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-x-hidden px-4 py-4 md:px-6 md:py-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

