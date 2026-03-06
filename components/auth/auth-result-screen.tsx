"use client";

import Link from "next/link";

type IconType = "check" | "mail" | "alert";

const icons: Record<IconType, React.ReactNode> = {
  check: (
    <svg
      className="mx-auto h-12 w-12 text-[var(--mg-accent)]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  mail: (
    <svg
      className="mx-auto h-12 w-12 text-[var(--mg-accent)]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    </svg>
  ),
  alert: (
    <svg
      className="mx-auto h-12 w-12 text-[var(--mg-muted)]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
      />
    </svg>
  ),
};

export function AuthPageHeader() {
  return (
    <header className="mx-auto mb-6 max-w-sm sm:mb-8">
      <Link
        href="/?mode=select"
        className="inline-flex items-center text-sm text-[var(--mg-muted)] hover:text-[var(--mg-ink)]"
      >
        ← トップへ
      </Link>
      <h1
        className="mt-3 text-xl font-semibold tracking-tight text-[var(--mg-ink)] sm:text-2xl"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        MachiGlyph
      </h1>
      <p className="mt-0.5 text-sm text-[var(--mg-muted)] leading-relaxed">
        まちの出来事に出会う
      </p>
    </header>
  );
}

type AuthResultScreenProps = {
  icon: IconType;
  title: string;
  description: string;
  note?: string;
  error?: string;
  children: React.ReactNode;
};

export function AuthResultScreen({
  icon,
  title,
  description,
  note,
  error,
  children,
}: AuthResultScreenProps) {
  return (
    <div
      className="min-h-screen bg-[var(--mg-paper)] px-4 py-6 sm:py-10"
      style={{ fontFamily: "var(--font-body)" }}
    >
      <AuthPageHeader />

      <div className="mx-auto max-w-sm rounded-2xl border border-[var(--mg-line)] bg-white p-6 shadow-[var(--mg-shadow)] sm:p-8">
        <div className="mb-5 flex justify-center" aria-hidden>
          {icons[icon]}
        </div>
        <h2 className="text-lg font-semibold text-[var(--mg-ink)] leading-tight">
          {title}
        </h2>
        <p className="mt-3 text-sm text-[var(--mg-muted)] leading-relaxed">
          {description}
        </p>
        {note && (
          <p className="mt-2 text-sm text-[var(--mg-muted)] leading-relaxed">
            {note}
          </p>
        )}
        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400 leading-relaxed">
            {error}
          </p>
        )}
        <div className="mt-6 space-y-3">
          {children}
        </div>
        <p className="mt-6 text-center text-sm text-[var(--mg-muted)]">
          <Link href="/?mode=select" className="underline hover:text-[var(--mg-ink)]">
            ← トップへ
          </Link>
        </p>
      </div>
    </div>
  );
}

export const authResultButtonClass = {
  primary:
    "flex h-12 w-full min-h-[var(--mg-touch-min)] items-center justify-center rounded-xl bg-[var(--mg-accent)] px-4 text-sm font-medium text-white hover:opacity-90",
  secondary:
    "flex h-12 w-full min-h-[var(--mg-touch-min)] items-center justify-center rounded-xl border border-[var(--mg-line)] bg-white px-4 text-sm font-medium text-[var(--mg-ink)] hover:bg-[var(--mg-paper)] disabled:opacity-50",
} as const;
