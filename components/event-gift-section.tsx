"use client";

import { useState } from "react";
import type { Event } from "@/lib/db/types";

type Props = {
  event: Event;
};

export function EventGiftSection({ event }: Props) {
  const [open, setOpen] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/gift-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          recipientName: recipientName.trim() || undefined,
          recipientEmail: recipientEmail.trim() || undefined,
          message: message.trim() || undefined,
          expiresInDays: 30,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "作成に失敗しました");
        return;
      }

      setCreatedCode(data.code);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-xl border border-[var(--border)] bg-white p-6 dark:bg-[var(--background)]">
      <h3 className="font-serif text-lg font-medium text-zinc-900 dark:text-zinc-100">
        体験ギフト
      </h3>
      <p className="mt-1 text-sm text-[var(--foreground-muted)]">
        このイベント参加権を大切な人に贈れます
      </p>

      {createdCode ? (
        <div className="mt-4 rounded-lg border border-[var(--accent)] bg-[var(--accent-soft)]/30 p-4">
          <p className="text-sm font-medium text-[var(--accent)]">ギフトコードを作成しました</p>
          <p className="mt-2 font-mono text-xl font-bold tracking-wider">{createdCode}</p>
          <p className="mt-2 text-xs text-[var(--foreground-muted)]">
            このコードを相手に伝えて、申込時にご入力ください
          </p>
          <button
            type="button"
            onClick={() => {
              setCreatedCode(null);
              setOpen(false);
              setRecipientName("");
              setRecipientEmail("");
              setMessage("");
            }}
            className="mt-4 text-sm font-medium text-[var(--accent)] hover:underline"
          >
            もう1枚作成する
          </button>
        </div>
      ) : (
        <>
          {!open ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-4 rounded-lg border border-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent-soft)]/30"
            >
              ギフトコードを発行する
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              <div>
                <label className="block text-sm text-zinc-600 dark:text-zinc-400">
                  贈り先の名前（任意）
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="mt-1 w-full rounded border border-[var(--border)] px-3 py-2 text-sm"
                  placeholder="山田 花子"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-600 dark:text-zinc-400">
                  贈り先のメール（任意）
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="mt-1 w-full rounded border border-[var(--border)] px-3 py-2 text-sm"
                  placeholder="example@example.com"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-600 dark:text-zinc-400">
                  メッセージ（任意）
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded border border-[var(--border)] px-3 py-2 text-sm"
                  placeholder="素敵な体験を楽しんでね！"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? "作成中..." : "発行する"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
                >
                  キャンセル
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </section>
  );
}
