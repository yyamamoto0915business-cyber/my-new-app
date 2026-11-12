"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Flag,
  HandHeart,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Sprout,
  Store,
  Ticket,
  Trophy,
  User,
  UserCog,
} from "lucide-react";
import { useSupabaseUser } from "@/hooks/use-supabase-user";

type RegisterAs = "individual" | "organization";

const BG_SRC = "/organizer/register-bg-hd.jpg";

/** 登録するとできること（今ある機能だけを書く） */
const FEATURES: { Icon: LucideIcon; title: string; desc: string }[] = [
  { Icon: CalendarDays, title: "イベントを掲載", desc: "1日だけの催しも、期間の企画も" },
  { Icon: HandHeart, title: "ボランティア募集", desc: "スタッフの応募の受付と連絡も" },
  { Icon: Ticket, title: "参加申し込み・参加パス", desc: "当日は QR で受付できる" },
  { Icon: Trophy, title: "スタンプラリー・クイズ", desc: "まち歩きのゲームを作れる" },
  { Icon: Store, title: "お店・キッチンカー", desc: "メニューや出店予定を載せる" },
  { Icon: MessageCircle, title: "参加者とメッセージ", desc: "質問や相談に直接答えられる" },
];

const CHOICES: {
  as: RegisterAs;
  Icon: LucideIcon;
  title: string;
  lead: string;
  points: string[];
  badge?: string;
  /** アイコン・ボタンの色 */
  tone: { icon: string; ring: string; button: string; shadow: string };
}[] = [
  {
    as: "individual",
    Icon: User,
    title: "個人として登録",
    lead: "自分の名前や活動名ではじめる",
    points: ["ひとりでイベントを開きたい", "地域活動・ボランティアをはじめたい"],
    badge: "はじめての方に",
    tone: {
      icon: "bg-[#eaf4ee] text-[#2e8a5a]",
      ring: "hover:border-[#9cc9ad]",
      button: "bg-[#2e8a5a] hover:bg-[#277a4f]",
      shadow: "shadow-[0_4px_14px_rgba(46,138,90,0.28)]",
    },
  },
  {
    as: "organization",
    Icon: Building2,
    title: "団体として登録",
    lead: "団体・サークル・お店の名前ではじめる",
    points: ["チームでイベントを運営している", "団体として活動を発信したい"],
    tone: {
      icon: "bg-[#eaf1fb] text-[#2b6cc4]",
      ring: "hover:border-[#9dbbe6]",
      button: "bg-[#2b6cc4] hover:bg-[#2459a3]",
      shadow: "shadow-[0_4px_14px_rgba(43,108,196,0.25)]",
    },
  },
];

const SAFETY: { Icon: LucideIcon; label: string }[] = [
  { Icon: UserCog, label: "公開する連絡先は自分で選べる" },
  { Icon: Flag, label: "困った投稿・相手は通報・ブロック" },
  { Icon: ShieldCheck, label: "通報は運営が24時間以内に確認" },
];

/**
 * 未登録ユーザー向け：個人／団体の選択 → 登録API → プロフィール編集へ
 * スマホでは縦に並べ、PC では左右2列。
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
      router.push(`/organizer/settings/profile?as=${registerAs}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "登録に失敗しました");
      setLoading(null);
    }
  };

  const busy = loading !== null;

  return (
    <div className="relative -mx-4 -my-2 overflow-hidden sm:-mx-6 min-[900px]:-mx-6 min-[900px]:-my-2.5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[260px] min-[900px]:h-[300px]" aria-hidden>
        <Image
          src={BG_SRC}
          alt=""
          fill
          priority
          quality={88}
          className="object-cover object-[center_32%]"
          sizes="(min-width: 900px) 1200px, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-[#f6f7f3]/80 to-[#f6f7f3]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[880px] px-4 pb-[calc(96px+env(safe-area-inset-bottom,0px))] pt-6 sm:px-6 min-[900px]:pb-10 min-[900px]:pt-8">
        <header className="text-center">
          <span
            className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#2e8a5a] shadow-[0_2px_12px_rgba(46,138,90,0.18)] ring-1 ring-[#d7e8dd]"
            aria-hidden
          >
            <Sprout className="h-5 w-5" strokeWidth={2.1} />
          </span>
          <h1 className="mt-3 text-[23px] font-bold tracking-tight text-[#1e3828] min-[900px]:text-[28px]">
            主催者としてはじめる
          </h1>
          <p className="mx-auto mt-2 max-w-[460px] text-[13px] leading-[1.75] text-[#4a6858] min-[900px]:text-[14px]">
            まちのイベントや募集、お店の情報を載せて、申し込みや当日の受付まで管理できます。
            <strong className="font-semibold text-[#2e6b4a]">登録は無料</strong>です。
          </p>
        </header>

        <section aria-labelledby="register-kind-heading" className="mt-6">
          <h2 id="register-kind-heading" className="mb-2.5 text-[13px] font-bold text-[#1e3828]">
            登録のしかたを選ぶ
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CHOICES.map((c) => (
              <article
                key={c.as}
                className={`flex flex-col rounded-[18px] border border-[#e3e8e2] bg-white p-4 shadow-[0_6px_24px_rgba(30,56,40,0.06)] transition ${c.tone.ring} min-[900px]:p-5`}
              >
                <div className="flex items-start gap-3">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${c.tone.icon}`} aria-hidden>
                    <c.Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h3 className="text-[16px] font-bold text-[#1e3828]">{c.title}</h3>
                      {c.badge ? (
                        <span className="rounded-full bg-[#fff4d6] px-2 py-[2px] text-[10.5px] font-semibold text-[#8a6510]">
                          {c.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-[12px] text-[#6a7a70]">{c.lead}</p>
                  </div>
                </div>
                <ul className="mt-3 space-y-1.5 pl-1">
                  {c.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-[12.5px] leading-[1.6] text-[#3a4a40]">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#b9c9bf]" aria-hidden />
                      {p}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleSelect(c.as)}
                  className={`mt-4 inline-flex min-h-[48px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 text-[14px] font-semibold text-white transition active:translate-y-px disabled:opacity-50 ${c.tone.button} ${c.tone.shadow}`}
                >
                  {loading === c.as ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      登録しています…
                    </>
                  ) : (
                    <>
                      {c.title}する
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </>
                  )}
                </button>
              </article>
            ))}
          </div>
          {error && (
            <p className="mt-3 text-center text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <p className="mt-2.5 text-center text-[11.5px] leading-[1.6] text-[#7a8a80]">
            表示名や個人／団体の見せ方は、あとからプロフィールで変えられます。
          </p>
        </section>

        <section aria-labelledby="register-features-heading" className="mt-7">
          <h2 id="register-features-heading" className="mb-2.5 text-[13px] font-bold text-[#1e3828]">
            登録するとできること
          </h2>
          <ul className="grid grid-cols-2 gap-2 min-[900px]:grid-cols-3 min-[900px]:gap-3">
            {FEATURES.map(({ Icon, title, desc }) => (
              <li
                key={title}
                className="flex items-start gap-2.5 rounded-[14px] border border-[#e8ece6] bg-white/90 px-3 py-3"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#f1f6f2] text-[#2e8a5a]" aria-hidden>
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold leading-snug text-[#1e3828]">{title}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-[#6a7a70]">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-2.5 rounded-[12px] bg-[#f3f6f1] px-3.5 py-2.5 text-[12px] leading-[1.7] text-[#4a5a50]">
            まずは無料の FREE プランではじめられます（公開できる掲載は1件まで）。
            もっと載せたいときや、ゲームを作りたいときは、あとから主催者の「プラン」で変えられます。
          </p>
        </section>

        <section aria-labelledby="register-safety-heading" className="mt-7">
          <h2 id="register-safety-heading" className="sr-only">
            安心して使うために
          </h2>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {SAFETY.map(({ Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2.5 rounded-[12px] border border-[#e3ece5] bg-white/80 px-3 py-2.5 text-[12px] font-medium text-[#2f4a3b]"
              >
                <Icon className="h-4 w-4 shrink-0 text-[#2e8a5a]" strokeWidth={2} aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
