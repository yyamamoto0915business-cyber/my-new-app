"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { cn } from "@/lib/utils";

export function PrivacySettingsClient() {
  const { user, loading: authLoading } = useSupabaseUser();
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetch("/api/me/privacy")
      .then((res) => (res.ok ? res.json() : { isPrivate: false }))
      .then((data: { isPrivate?: boolean }) => {
        setIsPrivate(Boolean(data.isPrivate));
      })
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  async function togglePrivate() {
    if (!user || busy) return;
    const next = !isPrivate;
    setIsPrivate(next);
    setBusy(true);
    try {
      const res = await fetch("/api/me/privacy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrivate: next }),
      });
      if (!res.ok) setIsPrivate(!next);
    } catch {
      setIsPrivate(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mg-profile-mobile-page mg-mypage-mobile-white relative z-[1] min-h-svh w-full bg-white">
      <div className="mx-auto w-full max-w-lg">
        <header className="flex items-center px-1 py-2">
          <Link
            href="/profile"
            className="flex h-10 w-10 items-center justify-center text-[#1a1a1a]"
            aria-label="戻る"
          >
            <ChevronLeft className="h-7 w-7" strokeWidth={1.6} aria-hidden />
          </Link>
          <h1 className="flex-1 pr-10 text-center text-[16px] font-semibold text-[#1a1a1a]">
            アカウントのプライバシー設定
          </h1>
        </header>

        {authLoading || loading ? (
          <p className="mt-10 text-center text-sm text-[#8e8e8e]">読み込み中…</p>
        ) : !user ? (
          <p className="mt-10 px-6 text-center text-sm text-[#8e8e8e]">
            ログインすると設定できます。
          </p>
        ) : (
          <div className="px-5 pt-4">
            <div className="flex items-center justify-between gap-4 py-2">
              <p className="text-[16px] text-[#1a1a1a]">非公開アカウント</p>
              <button
                type="button"
                role="switch"
                aria-checked={isPrivate}
                disabled={busy}
                onClick={() => void togglePrivate()}
                className={cn(
                  "relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors",
                  isPrivate ? "bg-[#34c759]" : "bg-[#e5e5ea]",
                )}
              >
                <span
                  className={cn(
                    "absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-sm transition-transform",
                    isPrivate ? "left-[22px]" : "left-[2px]",
                  )}
                />
              </button>
            </div>
            <div className="mt-3 space-y-3 text-[13px] leading-relaxed text-[#8e8e8e]">
              <p>
                公開のとき、プロフィールと投稿はフォローなしでも見られます。フォローに承認は不要です。
              </p>
              <p>
                非公開にすると、承認したフォロワーだけが非公開のアルバムを見られます。フォローにはあなたの承認が必要です。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
