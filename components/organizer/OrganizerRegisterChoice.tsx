"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowRight,
  Building2,
  Check,
  Lock,
  ShieldCheck,
  Sprout,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSupabaseUser } from "@/hooks/use-supabase-user";

type RegisterAs = "individual" | "organization";

const ORG_BLUE = "#2B7DE9";
const ORG_BLUE_DEEP = "#1A5FBF";
const ORG_BLUE_SOFT = "rgba(43, 125, 233, 0.12)";
const ORG_BLUE_BORDER = "rgba(43, 125, 233, 0.35)";

const BG_SRC = "/organizer/register-bg-hd.jpg";

const INDIVIDUAL_POINTS = [
  "個人でイベントを主催したい方",
  "地域活動やボランティアを始めたい方",
  "自分の名前で活動を発信したい方",
] as const;

const ORGANIZATION_POINTS = [
  "団体・サークルで活動している方",
  "チームでイベントを運営したい方",
  "組織として活動を発信したい方",
] as const;

const SAFETY_ITEMS = [
  { icon: Lock, label: "情報は非公開で管理" },
  { icon: ShieldCheck, label: "本人確認で安心" },
  { icon: Users, label: "地域コミュニティを守る" },
] as const;

/**
 * 未登録ユーザー向け：個人／団体の選択 → 登録API → プロフィール編集へ
 */
export function OrganizerRegisterChoice() {
  const router = useRouter();
  const { user } = useSupabaseUser();
  const [loading, setLoading] = useState<RegisterAs | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (registerAs: RegisterAs) => {
    setError(null);
    setLoading(registerAs);
    try {
      const displayName =
        (user?.user_metadata?.display_name as string | undefined) ??
        (user?.user_metadata?.name as string | undefined) ??
        user?.email?.split("@")[0] ??
        null;
      const organizationName =
        displayName?.trim() ||
        (registerAs === "individual" ? "新しい活動者" : "新しい団体");

      const res = await fetch("/api/organizer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "登録に失敗しました");
      router.push(`/profile/edit?tab=organizer&as=${registerAs}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "登録に失敗しました");
      setLoading(null);
    }
  };

  const busy = loading !== null;

  return (
    <div className="relative -mx-4 -my-2 mb-6 overflow-hidden sm:-mx-6 sm:mb-0 min-[900px]:-mx-6 min-[900px]:-my-2.5">
      {/* 背景（高解像度・ぼかしなし） */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src={BG_SRC}
          alt=""
          fill
          priority
          quality={92}
          className="object-cover object-[center_32%]"
          sizes="(min-width: 900px) 1200px, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/55 to-[#f4f6f2]/88" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-6 min-[900px]:max-w-3xl min-[900px]:px-5 min-[900px]:pb-4 min-[900px]:pt-4">
        {/* ヘッダー */}
        <header className="mb-5 text-center min-[900px]:mb-4">
          <span
            className="mx-auto mb-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[var(--accent)] shadow-[0_2px_12px_rgba(74,124,46,0.15)] ring-1 ring-[var(--accent)]/10 min-[900px]:mb-2 min-[900px]:h-8 min-[900px]:w-8"
            aria-hidden
          >
            <Sprout className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <h1 className="text-pretty text-[22px] font-bold leading-snug tracking-tight text-slate-800 sm:text-[24px] min-[900px]:text-[22px]">
            活動者登録をはじめる
          </h1>
          <p className="mx-auto mt-2 max-w-md text-[12px] leading-relaxed text-slate-600 sm:text-[13px] min-[900px]:mt-1.5 min-[900px]:text-[12px]">
            個人でも団体でも登録できます。イベントや地域活動の作成・募集管理を始めるための登録です。
          </p>
        </header>

        <section aria-labelledby="register-kind-heading">
          <h2 id="register-kind-heading" className="sr-only">
            登録のしかた
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 min-[900px]:gap-3.5">
            {/* 個人カード */}
            <article
              className={cn(
                "relative flex flex-col overflow-hidden rounded-[22px] border border-white/80",
                "bg-white/75 p-3 shadow-[0_8px_32px_rgba(44,42,40,0.08)] backdrop-blur-md",
                "sm:rounded-[26px] sm:p-4 min-[900px]:p-3.5"
              )}
            >
              <span
                className="pointer-events-none absolute -left-7 top-3 w-[7rem] -rotate-45 bg-[var(--accent)] py-[3px] text-center text-[10px] font-bold tracking-wide text-white shadow-sm"
                aria-hidden
              >
                おすすめ
              </span>

              <div className="mt-4 flex flex-col items-center text-center sm:mt-3">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)] ring-1 ring-[var(--accent)]/15 sm:h-12 sm:w-12 min-[900px]:h-10 min-[900px]:w-10"
                  aria-hidden
                >
                  <User className="h-5 w-5" strokeWidth={2} />
                </span>
                <h3 className="mt-2.5 text-[15px] font-bold text-[var(--accent)] sm:text-[16px] min-[900px]:mt-2 min-[900px]:text-[15px]">
                  個人として登録
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-500 min-[900px]:text-[11px]">
                  個人名・活動名で始める
                </p>
              </div>

              <div className="mt-3 flex-1 rounded-2xl bg-white/90 px-2.5 py-2.5 ring-1 ring-slate-100/80 sm:px-3 sm:py-3 min-[900px]:mt-2.5 min-[900px]:py-2">
                <ul className="space-y-1.5 min-[900px]:space-y-1">
                  {INDIVIDUAL_POINTS.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-1.5 text-[11px] leading-snug text-slate-600 sm:text-[12px] min-[900px]:text-[11px]"
                    >
                      <Check
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent)]"
                        strokeWidth={2.5}
                        aria-hidden
                      />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={() => handleSelect("individual")}
                className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] px-3 text-[12px] font-semibold text-white shadow-[0_4px_14px_rgba(74,124,46,0.35)] transition hover:opacity-95 disabled:opacity-50 touch-manipulation sm:min-h-[46px] sm:text-[13px] min-[900px]:mt-2.5 min-[900px]:min-h-[40px] min-[900px]:text-[12px]"
              >
                {loading === "individual" ? "登録中…" : "個人として登録する"}
                {loading !== "individual" && (
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                )}
              </button>
            </article>

            {/* 団体カード */}
            <article
              className={cn(
                "relative flex flex-col overflow-hidden rounded-[22px] border border-white/80",
                "bg-white/75 p-3 shadow-[0_8px_32px_rgba(44,42,40,0.08)] backdrop-blur-md",
                "sm:rounded-[26px] sm:p-4 min-[900px]:p-3.5"
              )}
              style={{ borderColor: ORG_BLUE_BORDER }}
            >
              <div className="mt-1 flex flex-col items-center text-center sm:mt-0">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full ring-1 sm:h-12 sm:w-12 min-[900px]:h-10 min-[900px]:w-10"
                  style={{
                    backgroundColor: ORG_BLUE_SOFT,
                    color: ORG_BLUE,
                    boxShadow: `inset 0 0 0 1px ${ORG_BLUE_BORDER}`,
                  }}
                  aria-hidden
                >
                  <Building2 className="h-5 w-5" strokeWidth={2} />
                </span>
                <h3
                  className="mt-2.5 text-[15px] font-bold sm:text-[16px] min-[900px]:mt-2 min-[900px]:text-[15px]"
                  style={{ color: ORG_BLUE }}
                >
                  団体として登録
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  団体・サークル向け
                </p>
              </div>

              <div className="mt-3 flex-1 rounded-2xl bg-white/90 px-2.5 py-2.5 ring-1 ring-slate-100/80 sm:px-3 sm:py-3 min-[900px]:mt-2.5 min-[900px]:py-2">
                <ul className="space-y-1.5 min-[900px]:space-y-1">
                  {ORGANIZATION_POINTS.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-1.5 text-[11px] leading-snug text-slate-600 sm:text-[12px] min-[900px]:text-[11px]"
                    >
                      <Check
                        className="mt-0.5 h-3.5 w-3.5 shrink-0"
                        style={{ color: ORG_BLUE }}
                        strokeWidth={2.5}
                        aria-hidden
                      />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={() => handleSelect("organization")}
                className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-full px-3 text-[12px] font-semibold text-white shadow-[0_4px_14px_rgba(43,125,233,0.35)] transition hover:opacity-95 disabled:opacity-50 touch-manipulation sm:min-h-[46px] sm:text-[13px] min-[900px]:mt-2.5 min-[900px]:min-h-[40px] min-[900px]:text-[12px]"
                style={{
                  backgroundImage: `linear-gradient(90deg, ${ORG_BLUE}, ${ORG_BLUE_DEEP})`,
                }}
              >
                {loading === "organization" ? "登録中…" : "団体として登録する"}
                {loading !== "organization" && (
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                )}
              </button>
            </article>
          </div>
        </section>

        {error && (
          <p className="mt-3 text-center text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {/* 安心バナー */}
        <div className="mt-4 rounded-2xl bg-[var(--accent-soft)]/90 px-3.5 py-3.5 shadow-[0_4px_20px_rgba(74,124,46,0.06)] backdrop-blur-sm sm:mt-5 sm:px-4 sm:py-4 min-[900px]:mt-3.5 min-[900px]:px-3.5 min-[900px]:py-3">
          <div className="flex items-start gap-3 min-[900px]:items-center">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-[0_2px_10px_rgba(74,124,46,0.3)] min-[900px]:h-8 min-[900px]:w-8"
              aria-hidden
            >
              <ShieldCheck className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-slate-800 min-[900px]:text-[13px]">
                安心・安全にご利用いただけます
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-slate-600">
                MachiGlyphでは、不正利用防止のため、登録情報の確認を行う場合があります。
              </p>
            </div>
          </div>

          <ul className="mt-3 grid grid-cols-3 gap-2 min-[900px]:mt-2.5">
            {SAFETY_ITEMS.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-white/80 bg-white/95 px-1.5 py-2.5 text-center shadow-sm min-[900px]:flex-row min-[900px]:justify-center min-[900px]:gap-1.5 min-[900px]:px-2 min-[900px]:py-2"
              >
                <Icon
                  className="h-4 w-4 shrink-0 text-[var(--accent)]"
                  strokeWidth={2}
                  aria-hidden
                />
                <span className="text-[10px] font-semibold leading-snug text-[var(--accent)] min-[900px]:text-[11px]">
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-3 text-center text-[11px] leading-snug text-slate-500 min-[900px]:mt-2.5">
          ※ 個人／団体の見せ方や表示名は、あとからプロフィール編集で変更できます。
        </p>
      </div>
    </div>
  );
}
