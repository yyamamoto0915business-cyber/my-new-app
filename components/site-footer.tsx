import Link from "next/link";
import { LEGAL_ENTITY } from "@/lib/legal";

const footerLinks = [
  { href: "/terms", label: "利用規約" },
  { href: "/privacy", label: "プライバシーポリシー" },
  { href: "/commerce", label: "特定商取引法に基づく表記" },
  { href: `mailto:${LEGAL_ENTITY.email}`, label: "お問い合わせ" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--mg-line)] bg-white/80 pb-[calc(80px+env(safe-area-inset-bottom,0px))] sm:pb-4">
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
        <nav
          aria-label="フッターナビゲーション"
          className="flex flex-wrap items-center justify-center gap-x-1 gap-y-2 sm:gap-x-2"
        >
          {footerLinks.map((link, i) => (
            <span key={link.href} className="flex items-center">
              {link.href.startsWith("mailto:") ? (
                <a
                  href={link.href}
                  className="whitespace-nowrap px-1.5 py-1 text-xs text-[var(--mg-muted)] transition-colors hover:text-[var(--mg-accent)] sm:text-[13px]"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  href={link.href}
                  className="whitespace-nowrap px-1.5 py-1 text-xs text-[var(--mg-muted)] transition-colors hover:text-[var(--mg-accent)] sm:text-[13px]"
                >
                  {link.label}
                </Link>
              )}
              {i < footerLinks.length - 1 && (
                <span
                  className="text-[var(--mg-line)] select-none"
                  aria-hidden
                >
                  ｜
                </span>
              )}
            </span>
          ))}
        </nav>
        <p className="mt-3 text-center text-[11px] text-[var(--mg-muted)]/60">
          &copy; MachiGlyph
        </p>
      </div>
    </footer>
  );
}
