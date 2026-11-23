"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, Gift, Loader2, Store } from "lucide-react";
import { CLAIM_GIFT_LABEL } from "@/lib/organizer/claim-gift";
import { useSupabaseUser } from "@/hooks/use-supabase-user";

type Info =
  | { state: "ok"; organizerName: string; stores: number; events: number; expiresAt: string }
  | { state: "expired" | "used" | "missing" };

const SERIF = "var(--font-serif-display), 'Shippori Mincho', 'Noto Serif JP', serif";

/**
 * 運営が代わりに作った主催者ページを、相手が受け取る画面。
 * ログイン（または新しく登録）して、利用者規約に同意すると、そのページの持ち主になる。
 */
export function ClaimPage({ token }: { token: string }) {
  const { user, loading: authLoading } = useSupabaseUser();
  const [info, setInfo] = useState<Info | null>(null);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/claims/${encodeURIComponent(token)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j: Info) => {
        if (!cancelled) setInfo(j);
      })
      .catch(() => {
        if (!cancelled) setInfo({ state: "missing" });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/claims/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agree: true }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "受け取れませんでした");
        return;
      }
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  const loginHref = `/auth?next=${encodeURIComponent(`/claim/${token}`)}`;
  const signupHref = `/auth?tab=signup&next=${encodeURIComponent(`/claim/${token}`)}`;

  return (
    <main className="flex min-h-screen-dvh items-start justify-center bg-[#f7f6f2] px-4 pb-16 pt-8">
      <div className="w-full max-w-md overflow-hidden rounded-[22px] border border-[#e6e2d6] bg-white shadow-[0_8px_28px_rgba(23,63,44,0.1)]">
        <div className="bg-gradient-to-br from-[#245a3e] to-[#173f2c] px-5 py-5">
          <p className="text-[10.5px] font-bold tracking-[0.2em] text-[#d9bc6e]">MACHIGLYPH</p>
          <h1 className="mt-1 text-[20px] font-semibold text-white" style={{ fontFamily: SERIF }}>
            主催者ページの受け取り
          </h1>
        </div>
        <div className="p-5">
          {!info ? (
            <p className="flex items-center gap-2 text-[13px] text-[#6b776f]">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              読み込んでいます…
            </p>
          ) : info.state !== "ok" ? (
            <div className="space-y-2">
              <p className="text-[15px] font-bold text-[#163828]">
                {info.state === "used"
                  ? "このリンクはもう使われています"
                  : info.state === "expired"
                    ? "このリンクは期限が切れています"
                    : "リンクが見つかりません"}
              </p>
              <p className="text-[13px] leading-relaxed text-[#5f6d64]">
                お手数ですが、リンクを送った運営（合同会社Act.）にご連絡ください。新しいリンクをお送りします。
              </p>
            </div>
          ) : done ? (
            <div className="space-y-3 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-[#2f7d4e]" aria-hidden />
              <p className="text-[16px] font-bold text-[#163828]">受け取りました</p>
              <p className="text-[13px] leading-relaxed text-[#5f6d64]">
                「{info.organizerName}」の主催者ページは、このアカウントのものになりました。主催者モードから、内容の確認や変更ができます。
              </p>
              <p className="rounded-[12px] bg-[#fbf5e3] px-3 py-2 text-[12.5px] font-semibold leading-relaxed text-[#7a5f1c]">
                {CLAIM_GIFT_LABEL}でお使いいただけます。まち歩きのスタンプラリーなども開催できます。
              </p>
              <a
                href="/organizer/home"
                className="flex h-12 w-full items-center justify-center rounded-[14px] border-[1.5px] border-[#d9bc6e] bg-gradient-to-b from-[#245a3e] to-[#173f2c] text-[15px] font-bold text-[#f6ebc8]"
              >
                主催者の画面を開く
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-[12px] font-bold text-[#a3812f]">運営が用意した主催者ページ</p>
                <p className="mt-0.5 text-[20px] font-semibold text-[#163828]" style={{ fontFamily: SERIF }}>
                  {info.organizerName}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#eef5f0] px-2.5 py-1 text-[12px] font-semibold text-[#1f6a42]">
                    <Store className="h-3.5 w-3.5" aria-hidden />
                    お店・キッチンカー {info.stores}件
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#eef5f0] px-2.5 py-1 text-[12px] font-semibold text-[#1f6a42]">
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                    イベント {info.events}件
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-[12px] border border-[#ecdcae] bg-[#fbf5e3] px-3 py-2.5">
                <Gift className="mt-0.5 h-4 w-4 shrink-0 text-[#a3812f]" aria-hidden />
                <p className="text-[12.5px] leading-relaxed text-[#5b4a1c]">
                  <span className="font-bold">受け取り特典：{CLAIM_GIFT_LABEL}</span>
                  <br />
                  半年後は無料プランに戻るだけで、自動で料金がかかることはありません。
                </p>
              </div>
              <p className="text-[13px] leading-relaxed text-[#3c4a40]">
                受け取ると、このページはあなたのアカウントのものになります。パスワードはご自身で決めたものだけを使い、運営が知ることはありません。
              </p>
              {authLoading ? null : !user ? (
                <div className="space-y-2">
                  <a
                    href={signupHref}
                    className="flex h-12 w-full items-center justify-center rounded-[14px] border-[1.5px] border-[#d9bc6e] bg-gradient-to-b from-[#245a3e] to-[#173f2c] text-[15px] font-bold text-[#f6ebc8]"
                  >
                    アカウントを作って受け取る
                  </a>
                  <a
                    href={loginHref}
                    className="flex h-11 w-full items-center justify-center rounded-[14px] border border-[#c9d8cd] bg-white text-[14px] font-bold text-[#173f2c]"
                  >
                    ログインして受け取る
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="flex items-start gap-2 rounded-[12px] bg-[#f7f6f2] px-3 py-2.5 text-[13px] leading-relaxed text-[#3c4a40]">
                    <input
                      type="checkbox"
                      checked={agree}
                      onChange={(e) => setAgree(e.target.checked)}
                      className="mt-1 h-4 w-4 shrink-0 accent-[#173f2c]"
                    />
                    <span>
                      <Link href="/terms" target="_blank" className="font-bold text-[#1f6a42] underline">
                        利用規約
                      </Link>
                      に同意し、掲載内容に責任を持ちます
                    </span>
                  </label>
                  {error ? (
                    <p className="rounded-[10px] bg-red-50 px-3 py-2 text-[12.5px] text-red-700" role="alert">
                      {error}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    disabled={!agree || busy}
                    onClick={() => void accept()}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-[#d9bc6e] bg-gradient-to-b from-[#245a3e] to-[#173f2c] text-[15px] font-bold text-[#f6ebc8] disabled:opacity-50"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                    このアカウントで受け取る
                  </button>
                  <p className="text-center text-[11.5px] text-[#8a968c]">
                    ログイン中：{user.email ?? "このアカウント"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
