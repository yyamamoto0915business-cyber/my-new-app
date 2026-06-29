"use client";

import Link from "next/link";
import { ChevronRight, Handshake } from "lucide-react";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { getLoginUrl } from "@/lib/auth-utils";

type Props = {
  eventId: string;
  returnTo?: string;
  variant?: "default" | "embedded";
};

export function EventDetailVolunteerPromo({
  eventId,
  returnTo,
  variant = "default",
}: Props) {
  const { user } = useSupabaseUser();
  const authDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";
  const href =
    !user && !authDisabled
      ? getLoginUrl(returnTo ?? `/recruitments?event=${eventId}`)
      : `/recruitments?event=${eventId}`;

  const isEmbedded = variant === "embedded";

  const body = (
    <>
      <div
        className={
          isEmbedded
            ? "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-50"
            : "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm"
        }
      >
        <Handshake className="h-7 w-7 text-[var(--accent)]" aria-hidden />
      </div>
      <div className={isEmbedded ? "mt-3 text-center" : "min-w-0 flex-1"}>
        {!isEmbedded ? (
          <h2 className="text-base font-semibold text-[var(--mg-ink)]">ボランティア募集</h2>
        ) : null}
        <p
          className={
            isEmbedded
              ? "text-xs leading-relaxed text-[var(--mg-muted)]"
              : "mt-1 text-sm leading-relaxed text-[var(--mg-muted)]"
          }
        >
          イベント運営をお手伝いいただける方を募集しています。
        </p>
        <Link
          href={href}
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)] hover:underline"
        >
          募集内容を見る
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </>
  );

  if (isEmbedded) {
    return <div className="flex flex-col items-center">{body}</div>;
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--mg-line)] bg-zinc-50/50 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">{body}</div>
    </section>
  );
}
