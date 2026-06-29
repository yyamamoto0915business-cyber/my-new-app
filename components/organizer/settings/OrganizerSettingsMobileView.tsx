"use client";

import Link from "next/link";

type MobileAccent = "plan" | "payout" | "account" | "display" | "notification" | "organizer" | "security";

const ACCENTS: Record<
  MobileAccent,
  { bar: string; iconBg: string; icon: string; footer: string }
> = {
  plan: { bar: "#E8A838", iconBg: "#FFF3D6", icon: "#9a7b20", footer: "#7A5800" },
  payout: { bar: "#E8708A", iconBg: "#FEF0F3", icon: "#b84060", footer: "#9a3050" },
  account: { bar: "#4a6a9a", iconBg: "#EEF4FB", icon: "#2B3A6B", footer: "#2B3A6B" },
  display: { bar: "#7a6a9a", iconBg: "#F0EEF8", icon: "#5c5680", footer: "#4a4568" },
  notification: { bar: "#7BADC4", iconBg: "#EEF4FB", icon: "#4a7a9a", footer: "#2B3A6B" },
  organizer: { bar: "#4a9a5a", iconBg: "#EAF6DE", icon: "#2d5c3a", footer: "#2d5c3a" },
  security: { bar: "#a08060", iconBg: "#F5F0EA", icon: "#6B4E10", footer: "#6B4E10" },
};

function Chevron({ className = "text-[#bbb]" }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={`shrink-0 ${className}`} aria-hidden>
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

function PrepBadge() {
  return (
    <span className="ml-1 rounded border border-[#E8C878] bg-[#FFF3CD] px-1 py-px text-[8px] font-medium leading-none text-[#7A5800]">
      準備中
    </span>
  );
}

function MobileCardShell({
  accent,
  href,
  onClick,
  children,
  footer,
}: {
  accent: MobileAccent;
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const a = ACCENTS[accent];
  const className =
    "block overflow-hidden rounded-lg border border-[#e8e6e0]/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-shadow active:shadow-[0_2px_6px_rgba(0,0,0,0.06)]";
  const style = { borderLeftWidth: 3, borderLeftColor: a.bar } as React.CSSProperties;

  const body = (
    <>
      {children}
      {footer ? (
        <div className="border-t border-[#ebe9e4] px-2.5 py-1.5" style={{ color: a.footer }}>
          {footer}
        </div>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} style={style}>
        {body}
      </Link>
    );
  }

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      className={`${className}${onClick ? " cursor-pointer" : ""}`}
      style={style}
    >
      {body}
    </div>
  );
}

function MobileCardHeader({
  accent,
  icon,
  title,
  description,
  titleExtra,
  trailing,
  compactDesc = false,
}: {
  accent: MobileAccent;
  icon: React.ReactNode;
  title: string;
  description?: string;
  titleExtra?: React.ReactNode;
  trailing?: React.ReactNode;
  compactDesc?: boolean;
}) {
  const a = ACCENTS[accent];
  return (
    <div className={`flex items-start gap-2 px-2.5 pt-2.5 ${compactDesc ? "pb-2.5" : "pb-2"}`}>
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full [&_svg]:h-[15px] [&_svg]:w-[15px]"
        style={{ background: a.iconBg, color: a.icon }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-1.5">
          <div className="min-w-0 flex-1">
            <h3 className="text-[13px] font-semibold leading-snug text-[#1a1a1a]">
              {title}
              {titleExtra}
            </h3>
            {description ? (
              <p className={`mt-px text-[#888] ${compactDesc ? "text-[10px] leading-snug" : "text-[10px] leading-relaxed"}`}>
                {description}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-start gap-1 pt-px">
            {trailing}
            <Chevron />
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileInfoBox({
  rows,
}: {
  rows: { label: string; value: string; valueClassName?: string }[];
}) {
  return (
    <div className="mx-2.5 mb-2 overflow-hidden rounded-md border border-[#e8e6e0]/80 bg-[#faf9f7]">
      {rows.map((r, i) => (
        <div
          key={r.label}
          className="flex items-start justify-between gap-2 px-2.5 py-1.5"
          style={{ borderBottom: i < rows.length - 1 ? "0.5px solid #ebe9e4" : "none" }}
        >
          <span className="shrink-0 pt-px text-[9px] font-medium text-[#888]">{r.label}</span>
          <span className={`min-w-0 break-all text-right text-[10px] leading-snug text-[#1a1a1a] ${r.valueClassName ?? ""}`}>
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function FooterLink({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center justify-between text-[11px] font-medium">
      {children}
      <Chevron className="opacity-70"/>
    </span>
  );
}

export type OrganizerSettingsMobileViewProps = {
  planLabel: string;
  slots: string;
  receiving: string | null;
  displayEmail: string;
  displayName: string;
  organizationName: string;
  contactVal: string;
  orgLoading: boolean;
  billingLoading: boolean;
};

export function OrganizerSettingsMobileView({
  planLabel,
  slots,
  receiving,
  displayEmail,
  displayName,
  organizationName,
  contactVal,
  orgLoading,
  billingLoading,
}: OrganizerSettingsMobileViewProps) {
  if (billingLoading) {
    return (
      <div className="flex flex-col gap-1.5 min-[900px]:hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-[72px] animate-pulse rounded-lg bg-[#e8e6e0]"/>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 min-[900px]:hidden">
      <MobileCardShell
        accent="plan"
        href="/organizer/settings/plan"
        footer={<FooterLink>プランを確認・変更</FooterLink>}
      >
        <MobileCardHeader
          accent="plan"
          title="主催者プラン（公開枠）"
          description="プランと公開枠の確認・変更"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 19h16"/>
              <path d="M6 19l1.5-8 3 3 3.5-7 3.5 7 3-3L18 19"/>
            </svg>
          }
          trailing={
            <div className="text-right leading-tight">
              <p className="text-[10px] font-semibold text-[#5a4020]">{planLabel}</p>
              <p className="text-[10px] font-semibold text-[#4A9A2E]">{slots}</p>
            </div>
          }
        />
      </MobileCardShell>

      <MobileCardShell
        accent="payout"
        href="/organizer/settings/payouts"
        footer={<FooterLink>設定を開く</FooterLink>}
      >
        <MobileCardHeader
          accent="payout"
          title="売上受取設定"
          description="Stripe連携（プランとは別）"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="1" y="4" width="22" height="16" rx="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          }
          trailing={
            receiving === "設定済み" ? (
              <span className="rounded border border-[#B8DEB0] bg-[#EAF6DE] px-1 py-px text-[9px] font-semibold text-[#3a7a10]">
                設定済み
              </span>
            ) : (
              <span className="rounded border border-[#F0C4D4] bg-[#FEF0F3] px-1 py-px text-[9px] font-semibold text-[#b84060]">
                {receiving ?? "未設定"}
              </span>
            )
          }
        />
      </MobileCardShell>

      <MobileCardShell
        accent="account"
        href="/profile/edit"
        footer={<FooterLink>プロフィールを編集</FooterLink>}
      >
        <MobileCardHeader
          accent="account"
          title="アカウント情報"
          description="ログイン・表示名"
          compactDesc
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          }
        />
        <MobileInfoBox
          rows={[
            { label: "ログイン中", value: displayEmail },
            { label: "表示名", value: displayName || "未設定" },
          ]}
        />
      </MobileCardShell>

      <MobileCardShell accent="display">
        <MobileCardHeader
          accent="display"
          title="公開情報 / 表示設定"
          description="表示設定（準備中）"
          compactDesc
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 21V9"/>
            </svg>
          }
        />
      </MobileCardShell>

      <MobileCardShell accent="notification">
        <MobileCardHeader
          accent="notification"
          title="通知設定"
          titleExtra={<PrepBadge />}
          description="お知らせの受け取り方"
          compactDesc
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
          }
        />
      </MobileCardShell>

      <MobileCardShell
        accent="organizer"
        href="/organizer/settings/profile"
        footer={<FooterLink>主催者プロフィールを編集</FooterLink>}
      >
        <MobileCardHeader
          accent="organizer"
          title="主催者プロフィール"
          description="団体・問い合わせ先"
          compactDesc
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M16 7V5a2 2 0 00-4 0v2M8 7V5a2 2 0 00-4 0v2"/>
            </svg>
          }
        />
        {orgLoading ? (
          <p className="mx-2.5 mb-2 text-[10px] text-[#888]">読み込み中...</p>
        ) : (
          <MobileInfoBox
            rows={[
              { label: "団体名", value: organizationName || "未設定" },
              { label: "問い合わせ先", value: contactVal },
            ]}
          />
        )}
      </MobileCardShell>

      <MobileCardShell
        accent="security"
        href="/profile/edit"
        footer={<FooterLink>アカウント設定を開く</FooterLink>}
      >
        <MobileCardHeader
          accent="security"
          title="セキュリティ / ログアウト"
          description="パスワード・ログアウト"
          compactDesc
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          }
        />
      </MobileCardShell>
    </div>
  );
}
