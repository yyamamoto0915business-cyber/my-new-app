"use client";

import Link from "next/link";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { getLoginUrl } from "@/lib/auth-utils";

type Props = {
  organizerName: string;
  organizerContact?: string | null;
  currentPath?: string;
};

/**
 * 主催者連絡先セクション
 * - ログイン時: 電話番号・メール等の連絡先を表示
 * - 未ログイン時: 連絡先を非表示にし、ログイン誘導を表示
 */
export function OrganizerContactSection({
  organizerName,
  organizerContact,
  currentPath,
}: Props) {
  const { user, loading } = useSupabaseUser();
  const authDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";
  const showContact = user || authDisabled;

  if (loading) {
    return (
      <div>
        <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">主催者</dt>
        <dd className="mt-1 text-sm text-zinc-500">読み込み中...</dd>
      </div>
    );
  }

  return (
    <div>
      <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">主催者</dt>
      <dd className="mt-1">
        {organizerName}
        {showContact && organizerContact && (
          <span className="ml-1 text-sm text-zinc-500">（{organizerContact}）</span>
        )}
        {!showContact && (
          <p className="mt-1 text-sm text-zinc-500">
            <Link
              href={getLoginUrl(currentPath ?? "/")}
              className="text-[var(--accent)] underline underline-offset-2 hover:no-underline"
            >
              ログインすると主催者に連絡できます
            </Link>
          </p>
        )}
      </dd>
    </div>
  );
}
