"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UsersRound } from "lucide-react";
import { useSupabaseUser } from "@/hooks/use-supabase-user";

type Info = { organizationName: string; roleLabel: string; usable: boolean; message: string | null; expiresAt: string };

/** 招待リンクを開いた人の画面：ログインして「参加する」を押すと、チームのメンバーになる */
export function TeamJoinPage({ token }: { token: string }) {
  const { user, loading } = useSupabaseUser();
  const [info, setInfo] = useState<Info | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    fetch(`/api/team-invites/${encodeURIComponent(token)}`, { cache: "no-store" })
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error ?? "招待リンクが見つかりません");
        setInfo(j as Info);
      })
      .catch((e: Error) => setError(e.message));
  }, [token]);

  async function join() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/team-invites/${encodeURIComponent(token)}`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "参加できませんでした");
      setJoined(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const next = `/team/join/${encodeURIComponent(token)}`;
  return (
    <main className="mx-auto flex min-h-[70dvh] w-full max-w-md flex-col justify-center px-4 py-8">
      <div className="flex flex-col items-center gap-3 rounded-[22px] border border-[#e3e8e3] bg-white px-5 py-7 text-center shadow-[0_3px_12px_rgba(22,56,40,0.06)]">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e6f3ea] text-[#2f7d4e]" aria-hidden>
          <UsersRound className="h-8 w-8" />
        </span>
        {error && !info ? (
          <p className="text-[14px] text-[#7a5a3a]">{error}</p>
        ) : !info ? (
          <div className="h-16 w-48 animate-pulse rounded bg-[#eef1ec]" />
        ) : joined ? (
          <>
            <h1 className="text-[19px] font-bold text-[#163828]">{info.organizationName}のチームに参加しました</h1>
            <p className="text-[13px] text-[#5f6d64]">{info.roleLabel}として、主催者モードで一緒に運営できます。</p>
            <Link href="/organizer/home" className="mt-2 flex h-12 w-full items-center justify-center rounded-[14px] bg-[#2f7d4e] text-[15px] font-bold text-white">
              主催者モードを開く
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-[19px] font-bold leading-snug text-[#163828]">
              {info.organizationName}のチームに
              <br />
              招待されています
            </h1>
            <p className="text-[13px] text-[#5f6d64]">権限：{info.roleLabel}</p>
            {!info.usable ? (
              <p className="text-[13px] text-[#7a5a3a]">{info.message}</p>
            ) : loading ? null : !user ? (
              <>
                <p className="text-[12.5px] text-[#6b776f]">参加するには、ログインしてください。</p>
                <Link
                  href={`/auth?next=${encodeURIComponent(next)}`}
                  className="mt-1 flex h-12 w-full items-center justify-center rounded-[14px] bg-[#2f7d4e] text-[15px] font-bold text-white"
                >
                  ログインして参加する
                </Link>
              </>
            ) : (
              <button type="button" onClick={() => void join()} disabled={busy} className="mt-1 h-12 w-full rounded-[14px] bg-[#2f7d4e] text-[15px] font-bold text-white disabled:opacity-60">
                {busy ? "参加しています…" : "参加する"}
              </button>
            )}
            {error ? <p className="text-[13px] font-bold text-[#b84060]" role="alert">{error}</p> : null}
          </>
        )}
      </div>
    </main>
  );
}
