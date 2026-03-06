"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthPageHeader } from "@/components/auth/auth-result-screen";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("パスワードが一致しません。もう一度入力してください。");
      return;
    }

    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください。");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      setError("エラーが発生しました。しばらくしてからもう一度お試しください。");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (updateError) {
      setError("エラーが発生しました。しばらくしてからもう一度お試しください。");
      return;
    }

    await supabase.auth.signOut();
    router.replace("/auth/reset-complete");
    router.refresh();
  };

  return (
    <div
      className="min-h-screen bg-[var(--mg-paper)] px-4 py-6 sm:py-10"
      style={{ fontFamily: "var(--font-body)" }}
    >
      <AuthPageHeader />
      <div className="mx-auto max-w-sm rounded-2xl border border-[var(--mg-line)] bg-white p-6 shadow-[var(--mg-shadow)] sm:p-8">
        <h1 className="text-lg font-semibold text-[var(--mg-ink)] leading-tight">新しいパスワードを設定</h1>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--mg-ink)]">
              新しいパスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="8文字以上で入力"
              autoComplete="new-password"
              className="mt-2 h-12 w-full min-h-[var(--mg-touch-min)] rounded-xl border border-[var(--mg-line)] bg-[var(--mg-paper)] px-4 text-base text-[var(--mg-ink)] placeholder:text-[var(--mg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--mg-accent)]/40"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-[var(--mg-ink)]">
              新しいパスワード（確認）
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              placeholder="もう一度入力"
              autoComplete="new-password"
              className="mt-2 h-12 w-full min-h-[var(--mg-touch-min)] rounded-xl border border-[var(--mg-line)] bg-[var(--mg-paper)] px-4 text-base text-[var(--mg-ink)] placeholder:text-[var(--mg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--mg-accent)]/40"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 leading-relaxed">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full min-h-[var(--mg-touch-min)] items-center justify-center rounded-xl bg-[var(--mg-accent)] px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "更新中..." : "パスワードを更新する"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-[var(--mg-muted)]">
          <Link href="/auth" className="underline hover:text-[var(--mg-ink)]">ログイン画面へ</Link>
        </p>
        <p className="mt-4 text-center text-sm text-[var(--mg-muted)]">
          <Link href="/?mode=select" className="underline hover:text-[var(--mg-ink)]">← トップへ</Link>
        </p>
      </div>
    </div>
  );
}
