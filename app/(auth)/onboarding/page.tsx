"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 font-medium text-white hover:opacity-90 disabled:opacity-50"
    >
      {pending ? "保存中..." : "決定"}
    </button>
  );
}

export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const role = (form.elements.namedItem("role") as HTMLInputElement)?.value;
    if (!role) {
      setError("モードを選択してください");
      return;
    }
    await update({ role });
    router.push("/");
    router.refresh();
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  if (session?.user?.role) {
    router.replace("/");
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          使い方を選んでください
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          主にどのように使いますか？（後から変更できます）
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <label className="flex cursor-pointer gap-3 rounded-xl border border-zinc-200 p-4 transition-colors has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent)]/5 dark:border-zinc-700 dark:has-[:checked]:border-[var(--accent)]">
              <input type="radio" name="role" value="ATTENDEE" className="mt-1" />
              <div>
                <span className="font-medium">イベント参加</span>
                <p className="text-sm text-zinc-500">イベントを探して参加する</p>
              </div>
            </label>
            <label className="flex cursor-pointer gap-3 rounded-xl border border-zinc-200 p-4 transition-colors has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent)]/5 dark:border-zinc-700 dark:has-[:checked]:border-[var(--accent)]">
              <input type="radio" name="role" value="VOLUNTEER" className="mt-1" />
              <div>
                <span className="font-medium">ボランティア参加</span>
                <p className="text-sm text-zinc-500">ボランティア募集に応募する</p>
              </div>
            </label>
            <label className="flex cursor-pointer gap-3 rounded-xl border border-zinc-200 p-4 transition-colors has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent)]/5 dark:border-zinc-700 dark:has-[:checked]:border-[var(--accent)]">
              <input type="radio" name="role" value="ORGANIZER" className="mt-1" />
              <div>
                <span className="font-medium">主催者</span>
                <p className="text-sm text-zinc-500">イベントや募集を登録・管理する</p>
              </div>
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
