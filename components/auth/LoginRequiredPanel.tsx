import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Check, LogIn } from "lucide-react";
import { getLoginUrl } from "@/lib/auth-utils";

type Props = {
  /** ログインしたあとに戻ってくる場所 */
  returnTo: string;
  Icon: LucideIcon;
  title: string;
  description: string;
  /** ログインするとできること（2〜3個） */
  benefits?: string[];
};

/**
 * ログインが必要な画面で出す案内。ログイン・新規登録のどちらにも進める。
 * PC では左にアイコンとできること、右にボタンを並べ、スマホでは縦に並べる。
 */
export function LoginRequiredPanel({ returnTo, Icon, title, description, benefits }: Props) {
  const loginHref = getLoginUrl(returnTo);
  const signupHref = `${loginHref}${loginHref.includes("?") ? "&" : "?"}tab=signup`;

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-[#f8f7f4] px-4 py-10">
      <section className="w-full max-w-[440px] overflow-hidden rounded-[20px] border border-[#e6e1d8] bg-white shadow-[0_8px_32px_rgba(30,56,40,0.08)] min-[900px]:max-w-[760px]">
        <div className="min-[900px]:grid min-[900px]:grid-cols-[1.1fr_1fr]">
          <div className="relative bg-gradient-to-br from-[#eaf4ee] via-[#f3f8f4] to-[#fbf8f1] px-6 pb-6 pt-8 min-[900px]:px-9 min-[900px]:py-10">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#2e8a5a] shadow-[0_2px_10px_rgba(46,138,90,0.15)] ring-1 ring-[#d7e8dd]">
              <Icon className="h-6 w-6" strokeWidth={1.9} aria-hidden />
            </span>
            <h1 className="mt-4 text-[20px] font-bold tracking-tight text-[#1e3828] min-[900px]:text-[23px]">
              {title}
            </h1>
            <p className="mt-2 text-[13px] leading-[1.75] text-[#4a6858] min-[900px]:text-[14px]">
              {description}
            </p>
            {benefits && benefits.length > 0 ? (
              <ul className="mt-5 space-y-2.5">
                {benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-[13px] leading-[1.6] text-[#2f4a3b]">
                    <span className="mt-[1px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#2e8a5a] text-white">
                      <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="flex flex-col justify-center gap-3 px-6 py-6 min-[900px]:px-9 min-[900px]:py-10">
            <p className="hidden text-[13px] font-semibold text-[#1e3828] min-[900px]:block">
              MachiGlyph のアカウントで続ける
            </p>
            <Link
              href={loginHref}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#2e8a5a] px-6 text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(46,138,90,0.28)] transition hover:bg-[#277a4f] active:translate-y-px"
            >
              <LogIn className="h-4 w-4" aria-hidden />
              ログイン
            </Link>
            <Link
              href={signupHref}
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[#cfe0d5] bg-white px-6 text-[15px] font-semibold text-[#2e6b4a] transition hover:bg-[#f3f8f4]"
            >
              はじめての方は新規登録（無料）
            </Link>
            <p className="pt-1 text-center text-[11px] leading-[1.6] text-[#8a978f]">
              ログインできないときは{" "}
              <Link href="/contact" className="underline underline-offset-2 hover:text-[#2e6b4a]">
                お問い合わせ
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
