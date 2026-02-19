"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getOrCreateUser } from "@/lib/auth-users";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      getOrCreateUser(email.trim().toLowerCase(), displayName.trim() || email.split("@")[0] || "User");
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password: password || "signup",
        name: displayName.trim() || undefined,
        redirect: false,
      });
      setLoading(false);
      if (res?.error) {
        setError(res.error);
        return;
      }
      if (res?.ok) {
        router.push("/");
        router.refresh();
        return;
      }
    } catch {
      setError("登録に失敗しました");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-zinc-200/60 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <h1 className="text-xl font-semibold">新規登録</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium">
              表示名（任意）
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="例: 山田 太郎"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--accent)] px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "登録中..." : "登録する"}
          </button>
        </form>
        <p className="text-center text-sm text-zinc-500">
          すでにアカウントをお持ちの方は{" "}
          <Link href="/login" className="underline">
            ログイン
          </Link>
        </p>
        <Link href="/" className="block text-center text-sm text-zinc-500">
          ← トップへ
        </Link>
      </div>
    </div>
  );
}
