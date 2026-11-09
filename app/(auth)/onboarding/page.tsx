"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Check, Images, Loader2, Megaphone, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { setModeCookie, type ModePreference } from "@/lib/mode-preference";

const AUTH_DISABLED = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

type Role = "ATTENDEE" | "VOLUNTEER" | "ORGANIZER";

const CHOICES: {
  role: Role;
  Icon: LucideIcon;
  title: string;
  desc: string;
  cta: string;
  /** アイコンの丸の色 */
  tone: string;
}[] = [
  {
    role: "ATTENDEE",
    Icon: Search,
    title: "まちの情報を探す",
    desc: "イベント・お店・募集をまとめて見つけられます",
    cta: "まちの情報ではじめる",
    tone: "bg-sky-50 text-sky-600 ring-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-900",
  },
  {
    role: "VOLUNTEER",
    Icon: Images,
    title: "みんなの投稿を楽しむ",
    desc: "地域の写真や投稿から、まちの魅力に出会えます",
    cta: "みんなの投稿ではじめる",
    tone: "bg-orange-50 text-orange-500 ring-orange-100 dark:bg-orange-950/40 dark:text-orange-300 dark:ring-orange-900",
  },
  {
    role: "ORGANIZER",
    Icon: Megaphone,
    title: "主催・掲載する",
    desc: "イベントや募集を掲載して、申し込みまで管理できます",
    cta: "主催者としてはじめる",
    tone: "bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900",
  },
];

function roleToMode(role: Role): ModePreference {
  if (role === "VOLUNTEER") return "VOLUNTEER";
  if (role === "ORGANIZER") return "ORGANIZER";
  return "EVENT";
}

function profileEditPath(role: Role): string {
  const params = new URLSearchParams({ from: "signup" });
  if (role === "ORGANIZER") params.set("tab", "organizer");
  return `/profile/edit?${params.toString()}`;
}

export default function OnboardingPage() {
  const { user, loading: authLoading } = useSupabaseUser();
  const router = useRouter();
  const [selected, setSelected] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<"choose" | "skip" | null>(null);
  // 送信成功時は自前で遷移するため、role 反映後の自動リダイレクトを抑止する
  const redirectingRef = useRef(false);

  const currentRole = user?.user_metadata?.role as string | undefined;
  const selectedChoice = CHOICES.find((c) => c.role === selected);

  // レンダー中に router を呼ぶと "Cannot update a component while rendering" になるため副作用で遷移する
  useEffect(() => {
    if (authLoading || redirectingRef.current) return;
    if (!user) {
      router.replace(AUTH_DISABLED ? "/" : "/auth");
      return;
    }
    if (currentRole) {
      router.replace("/");
    }
  }, [authLoading, user, currentRole, router]);

  const saveRole = async (role: Role, destination: string, kind: "choose" | "skip") => {
    setError(null);
    const supabase = createClient();
    if (!supabase || !user) {
      setError("ログインが必要です");
      return;
    }

    setSubmitting(kind);
    try {
      // 主催は先にレコードを作る（role 保存後に失敗すると onboarding に戻れなくなるため）
      if (role === "ORGANIZER") {
        const organizationName =
          (user.user_metadata?.display_name as string | undefined)?.trim() ||
          (user.user_metadata?.name as string | undefined)?.trim() ||
          user.email?.split("@")[0] ||
          "主催者";
        const res = await fetch("/api/organizer/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organizationName }),
        });
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          throw new Error(json.error ?? "主催者登録に失敗しました");
        }
      }

      const { error: updateError } = await supabase.auth.updateUser({ data: { role } });
      if (updateError) throw updateError;
      // proxy の role 判定で再び /onboarding に戻されないようセッションを更新
      await supabase.auth.refreshSession();

      setModeCookie(roleToMode(role));
      redirectingRef.current = true;
      router.push(destination);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
      setSubmitting(null);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selected) {
      setError("使い方を選んでください");
      return;
    }
    void saveRole(selected, profileEditPath(selected), "choose");
  };

  // role 未設定のままだと proxy にここへ戻されるため、「まずは見てみる」も参加者として保存してから移動する
  const handleSkip = () => {
    void saveRole("ATTENDEE", "/", "skip");
  };

  // 読み込み中・未ログイン・role 設定済み（＝上の useEffect でリダイレクト対象）はフォームを描画しない
  if (authLoading || !user || currentRole) {
    return (
      <div className="flex min-h-screen-dvh items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" aria-label="読み込み中" />
      </div>
    );
  }

  const busy = submitting !== null;

  return (
    <div className="relative min-h-screen-dvh overflow-x-clip bg-[var(--mg-paper)] dark:bg-zinc-950">
      {/* 背景のやわらかい色だまり */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-[var(--accent)]/10 blur-3xl tablet:h-[28rem] tablet:w-[28rem]" />
        <div className="absolute top-1/3 -right-32 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl tablet:h-96 tablet:w-96 dark:bg-amber-500/10" />
      </div>

      <div className="relative mx-auto flex min-h-screen-dvh w-full max-w-6xl flex-col px-5 pt-[max(2.5rem,env(safe-area-inset-top))] tablet:justify-center tablet:px-8 tablet:py-14 pc:grid pc:grid-cols-[1fr_minmax(0,30rem)] pc:items-center pc:gap-16 pc:px-12">
        {/* 紹介（PC は左の列） */}
        <header className="animate-in fade-in slide-in-from-bottom-2 duration-700 tablet:text-center pc:text-left">
          <p className="text-[11px] font-semibold tracking-[0.25em] text-[var(--accent)] uppercase">
            MachiGlyph
          </p>
          <h1 className="mt-3 font-serif text-[1.75rem] leading-snug font-semibold text-zinc-900 tablet:text-4xl pc:text-5xl pc:leading-tight dark:text-zinc-50">
            まちの出来事に
            <br className="hidden pc:block" />
            出会う
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600 tablet:mx-auto tablet:max-w-md tablet:text-base pc:mx-0 dark:text-zinc-400">
            はじめに、いちばん使いたいことを選んでください。
            <br className="hidden tablet:block" />
            あとからいつでも切り替えられます。
          </p>

          {/* PC だけ：できることの一覧 */}
          <ul className="mt-10 hidden space-y-4 pc:block">
            {[
              "イベント・お店・募集をまとめて探せる",
              "写真の投稿で、まちの魅力をシェアできる",
              "イベントの掲載から申し込みの管理まで",
            ].map((text) => (
              <li key={text} className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </header>

        {/* 選択（タブレット・PC はカードに入れる） */}
        <form
          onSubmit={handleSubmit}
          className="animate-in fade-in slide-in-from-bottom-4 mt-8 flex flex-1 flex-col pb-40 duration-700 tablet:pb-8 tablet:mx-auto tablet:mt-10 tablet:w-full tablet:max-w-xl tablet:flex-none tablet:rounded-3xl tablet:border tablet:border-zinc-200/70 tablet:bg-white/85 tablet:p-8 tablet:shadow-xl tablet:shadow-zinc-900/5 tablet:backdrop-blur pc:mt-0 pc:max-w-none tablet:dark:border-zinc-800 tablet:dark:bg-zinc-900/80"
        >
          <fieldset disabled={busy} className="space-y-3">
            <legend className="mb-3 text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
              使い方を選ぶ
            </legend>
            {CHOICES.map(({ role, Icon, title, desc, tone }) => (
              <label
                key={role}
                className="group relative flex cursor-pointer items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 transition-all hover:border-zinc-300 hover:shadow-sm active:scale-[0.99] has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent-soft)]/60 has-[:checked]:shadow-md has-[:checked]:shadow-[var(--accent)]/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--accent)]/40 tablet:p-5 dark:border-zinc-700 dark:bg-zinc-900 dark:has-[:checked]:bg-[var(--accent)]/10"
              >
                <input
                  type="radio"
                  name="role"
                  value={role}
                  checked={selected === role}
                  onChange={() => {
                    setSelected(role);
                    setError(null);
                  }}
                  className="sr-only"
                />
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ring-1 ${tone}`}>
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-zinc-900 dark:text-zinc-100">{title}</span>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {desc}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-zinc-300 text-white transition-colors group-has-[:checked]:border-[var(--accent)] group-has-[:checked]:bg-[var(--accent)] dark:border-zinc-600"
                >
                  <Check className="h-3.5 w-3.5 opacity-0 transition-opacity group-has-[:checked]:opacity-100" strokeWidth={3} />
                </span>
              </label>
            ))}
          </fieldset>

          {selected === "ORGANIZER" && (
            <p className="mt-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              主催者のプロフィール（団体名など）は次の画面で設定できます。
            </p>
          )}

          {error && (
            <p role="alert" className="mt-4 text-sm text-red-600">
              {error}
            </p>
          )}

          {/* スマホは画面下に固定、タブレット・PC はカードの中 */}
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200/70 bg-[var(--mg-paper)]/95 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur tablet:static tablet:z-auto tablet:mx-0 tablet:mt-6 tablet:border-0 tablet:bg-transparent tablet:p-0 tablet:backdrop-blur-none dark:border-zinc-800 dark:bg-zinc-950/90 tablet:dark:bg-transparent">
            <button
              type="submit"
              disabled={busy || !selected}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3.5 font-semibold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:bg-[var(--accent-hover)] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none dark:disabled:bg-zinc-700"
            >
              {submitting === "choose" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  準備中...
                </>
              ) : (
                <>
                  {selectedChoice?.cta ?? "使い方を選んでください"}
                  {selectedChoice && <ArrowRight className="h-4 w-4" />}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              disabled={busy}
              className="mt-2 w-full py-2 text-center text-sm text-zinc-500 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-800 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              {submitting === "skip" ? "移動しています..." : "あとで決めて、まずは見てみる"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
