"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { setModeCookie, type ModePreference } from "@/lib/mode-preference";

const AUTH_DISABLED = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

function roleToMode(role: string): ModePreference {
  if (role === "VOLUNTEER") return "VOLUNTEER";
  if (role === "ORGANIZER") return "ORGANIZER";
  return "EVENT";
}

function profileEditPath(role: string): string {
  const params = new URLSearchParams({ from: "signup" });
  if (role === "ORGANIZER") params.set("tab", "organizer");
  return `/profile/edit?${params.toString()}`;
}

export default function OnboardingPage() {
  const { user, loading: authLoading } = useSupabaseUser();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const role = String(new FormData(form).get("role") || "");
    if (!role) {
      setError("使い方を選んでください");
      return;
    }

    const supabase = createClient();
    if (!supabase || !user) {
      setError("ログインが必要です");
      return;
    }

    setSubmitting(true);
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
      router.push(profileEditPath(role));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    if (AUTH_DISABLED) {
      router.replace("/");
      return null;
    }
    router.replace("/auth");
    return null;
  }

  const role = user.user_metadata?.role as string | undefined;
  if (role) {
    router.replace("/");
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
        <h1 className="font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          まちの出来事に出会う
        </h1>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          イベントに参加したい人も、活動を主催したい人も、ここから始められます
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <label className="flex cursor-pointer gap-3 rounded-xl border border-zinc-200 p-4 transition-colors has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent)]/5 dark:border-zinc-700 dark:has-[:checked]:border-[var(--accent)]">
              <input type="radio" name="role" value="ATTENDEE" className="mt-1" disabled={submitting} />
              <div>
                <span className="font-medium">イベントを探したい</span>
                <p className="text-sm text-zinc-500">地域で開かれているイベントを見つけられます</p>
              </div>
            </label>
            <label className="flex cursor-pointer gap-3 rounded-xl border border-zinc-200 p-4 transition-colors has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent)]/5 dark:border-zinc-700 dark:has-[:checked]:border-[var(--accent)]">
              <input type="radio" name="role" value="VOLUNTEER" className="mt-1" disabled={submitting} />
              <div>
                <span className="font-medium">募集を見たい</span>
                <p className="text-sm text-zinc-500">参加者募集や、お手伝いの募集を探せます</p>
              </div>
            </label>
            <label className="flex cursor-pointer gap-3 rounded-xl border border-zinc-200 p-4 transition-colors has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent)]/5 dark:border-zinc-700 dark:has-[:checked]:border-[var(--accent)]">
              <input type="radio" name="role" value="ORGANIZER" className="mt-1" disabled={submitting} />
              <div>
                <span className="font-medium">主催者として始めたい</span>
                <p className="text-sm text-zinc-500">イベントの作成や募集掲載ができます</p>
              </div>
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "準備中..." : "この使い方ではじめる"}
          </button>
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            <Link href="/events" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">
              まずはイベントを見てみる
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
