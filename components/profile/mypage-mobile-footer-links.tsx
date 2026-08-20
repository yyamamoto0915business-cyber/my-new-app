import Link from "next/link";
import { Fragment } from "react";

const MG_GREEN = "#315c4b";

const links = [
  {
    href: "/terms",
    label: "利用規約",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    href: "/privacy",
    label: "プライバシーポリシー",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden>
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    ),
  },
  {
    href: "/commerce",
    label: (
      <>
        特定商取引法に
        <br />
        基づく表記
      </>
    ),
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    href: "/contact",
    label: "お問い合わせ",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
] as const;

function FooterLinkItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: React.ReactNode;
}) {
  const className =
    "flex min-h-[var(--mg-touch-min)] flex-1 flex-col items-center justify-center gap-2 px-1 py-1 transition-opacity hover:opacity-80";

  const inner = (
    <>
      <span style={{ color: MG_GREEN }}>{icon}</span>
      <span
        className="text-center text-[10px] font-medium leading-[1.35]"
        style={{ color: MG_GREEN }}
      >
        {label}
      </span>
    </>
  );

  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}

export function MypageMobileFooterLinks() {
  return (
    <nav
      aria-label="フッターナビゲーション"
      className="relative z-[1] overflow-hidden rounded-[14px] border border-[#e8e6e0] bg-[#ffffff]"
      style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 12px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.04)" }}
    >
      <div className="flex items-stretch px-1 py-2.5">
        {links.map((link, index) => (
          <Fragment key={link.href}>
            {index > 0 && (
              <div
                className="my-auto h-10 w-px shrink-0 bg-[#e0ded8]"
                aria-hidden
              />
            )}
            <FooterLinkItem href={link.href} icon={link.icon} label={link.label} />
          </Fragment>
        ))}
      </div>
    </nav>
  );
}
