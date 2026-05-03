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
  const stroke = active ? "#e0f8f0" : "rgba(230,250,235,0.75)";
  if (icon === "dashboard") {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 13h8V3H3v10zM13 21h8v-6h-8v6zM13 3v6h8V3h-8zM3 21h8v-4H3v4z" />
      </svg>
    );
  }
  if (icon === "organizers") {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="3" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  if (icon === "logs") {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 4h18M3 9h18M3 14h18M3 19h18M8 4v16" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    <div className="min-h-screen" style={{ background: "#eaf2ec" }}>
      {/* Admin bar */}
      <div style={{
        background: "#1e3848",
        color: "#e0f0f8",
        fontSize: 10,
        padding: "7px 20px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        letterSpacing: "0.08em",
        position: "sticky",
        top: 0,
        zIndex: 200,
      }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#70c8e0", flexShrink: 0 }} />
        管理者モード — {adminEmail ?? "開発者ユーザー"}
      </div>

      <div className="mx-auto flex max-w-6xl gap-0 px-3 py-4 md:px-4 md:py-6">
        {/* Sidebar */}
        <aside className="hidden w-52 shrink-0 flex-col overflow-hidden rounded-xl shadow-sm ring-1 ring-[#a8ccb8] md:flex" style={{ background: "#f4faf6" }}>
          {/* Sidebar header */}
          <div style={{ background: "#4a6840", padding: "14px", position: "relative", overflow: "hidden" }}>
            <svg style={{ position: "absolute", right: 8, top: 8, opacity: 0.22 }} width="28" height="28" viewBox="0 0 28 28" aria-hidden>
              <circle cx="14" cy="14" r="12" fill="none" stroke="#f0d870" strokeWidth="0.8"/>
              <circle cx="14" cy="14" r="7.5" fill="none" stroke="#f0d870" strokeWidth="0.5"/>
              <path d="M14 2 L14 26 M2 14 L26 14 M5 5 L23 23 M23 5 L5 23" stroke="#f0d870" strokeWidth="0.4"/>
            </svg>
            <div style={{ fontFamily: "var(--font-serif, serif)", fontSize: 13, fontWeight: 600, color: "#fff" }}>
              管理者画面
            </div>
            <div style={{ fontSize: 10, color: "rgba(230,250,235,0.95)", marginTop: 2, letterSpacing: "0.06em" }}>
              MachiGlyph Admin
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-0.5 p-2" aria-label="管理者メニュー">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors ${
                    active
                      ? "font-medium"
                      : "hover:bg-[#dff0e8]"
                  }`}
                  style={active
                    ? { background: "#1e3848", color: "#e0f8f0" }
                    : { color: "#1e3828" }
                  }
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${active ? "" : "bg-[#eaf2ec]"}`}
                    style={active ? { background: "rgba(255,255,255,0.12)" } : {}}>
                    <NavIcon icon={item.icon} active={active} />
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom links */}
          <div className="shrink-0 border-t border-[#c8dcd0] p-2 space-y-0.5">
            <Link
              href="/organizer"
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] text-[#3a5848] transition hover:bg-[#dff0e8]"
            >
              ← 主催者ページへ戻る
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] text-[#3a5848] transition hover:bg-[#dff0e8]"
            >
              ← サイトへ戻る
            </Link>
          </div>
        </aside>

        {/* Main area */}
        <div className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col overflow-hidden rounded-xl shadow-sm ring-1 ring-[#a8ccb8] md:ml-4" style={{ background: "#f4faf6" }}>
          {/* Main header */}
          <header className="flex items-center justify-between gap-3 border-b border-[#c8dcd0] px-4 py-3">
            <div className="flex flex-col">
              <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#7a9888]">
                Developer Console
              </span>
              <span className="text-[14px] font-semibold text-[#0e1610]" style={{ fontFamily: "var(--font-serif, serif)" }}>
                開発者管理画面
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{
                padding: "3px 10px",
                borderRadius: 20,
                fontSize: 10,
                background: "#1e3848",
                color: "#70c8e0",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}>
                🔐 管理者
              </span>
              <div className="flex flex-col items-end">
                <span className="text-[12px] font-medium text-[#0e1610]">
                  {adminEmail ?? "開発者ユーザー"}
                </span>
                <span className="text-[11px] text-[#7a9888]">
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
