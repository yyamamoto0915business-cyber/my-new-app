"use client";

import Link from "next/link";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { getLoginUrl } from "@/lib/auth-utils";

type Props = {
  /** ログイン後のリダイレクト先 */
  returnTo?: string;
  /** 表示サイズ（デフォルト: small） */
  variant?: "small" | "default";
};

/**
 * 未ログインユーザー向け「ログインするとできること」バナー
 */
export function LoginBenefitsBanner({ returnTo, variant = "small" }: Props) {
  const { user, loading } = useSupabaseUser();
  const authDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

  if (loading || user || authDisabled) return null;

  const benefits = ["保存", "応募", "チャット", "予定管理"];
  const loginHref = getLoginUrl(returnTo ?? "/");

  if (variant === "small") {
    return (
      <div className="rounded-lg border border-zinc-200/60 bg-zinc-50/50 px-4 py-3 dark:border-zinc-700/60 dark:bg-zinc-800/30">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          ログインすると
          <span className="mx-1 font-medium">{benefits.join("・")}</span>
          ができます
        </p>
        <Link
          href={loginHref}
          className="mt-2 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
        >
          ログインする →
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200/60 bg-zinc-50/80 p-4 dark:border-zinc-700/60 dark:bg-zinc-800/40">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        ログインするとできること
      </h3>
      <ul className="mt-2 flex flex-wrap gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        {benefits.map((b) => (
          <li key={b} className="rounded bg-white/60 px-2 py-0.5 dark:bg-zinc-700/40">
            {b}
          </li>
        ))}
      </ul>
      <Link
        href={loginHref}
        className="mt-3 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        ログインする
      </Link>
    </div>
  );
}
