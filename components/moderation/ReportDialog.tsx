"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export type ReportTargetType = "post" | "comment" | "user";

const REASONS = [
  { value: "spam", label: "スパム・宣伝" },
  { value: "harassment", label: "嫌がらせ・いじめ" },
  { value: "sexual", label: "性的な内容" },
  { value: "violence", label: "暴力・危険な内容" },
  { value: "privacy", label: "個人情報・なりすまし" },
  { value: "other", label: "その他" },
] as const;

const TARGET_LABELS: Record<ReportTargetType, string> = {
  post: "この投稿",
  comment: "このコメント",
  user: "このユーザー",
};

type Props = {
  targetType: ReportTargetType;
  targetId: string;
  onClose: () => void;
  /** 通報を受け付けたとき */
  onReported?: () => void;
};

/** 通報の理由を選んで送る画面（下からせり上がる） */
export function ReportDialog({ targetType, targetId, onClose, onReported }: Props) {
  const [reason, setReason] = useState<string | null>(null);
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason, detail }),
      });
      if (res.status === 401) {
        setNeedsLogin(true);
        return;
      }
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? "通報を送れませんでした");
        return;
      }
      setDone(true);
      onReported?.();
    } catch {
      setError("通信エラーです。もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  const loginNext =
    typeof window !== "undefined" ? window.location.pathname : "/posts";

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/45 min-[600px]:items-center"
      onClick={onClose}
      data-no-swipe
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="通報する"
        className="w-full max-w-md rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] text-[#2a2218] shadow-xl min-[600px]:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">
            {done ? "通報を受け付けました" : `${TARGET_LABELS[targetType]}を通報する`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 rounded-full p-2 text-[#6a6258] hover:bg-black/5"
            aria-label="閉じる"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {done ? (
          <div className="mt-3 space-y-4 text-sm leading-relaxed text-[#4a4238]">
            <p>
              ご協力ありがとうございます。運営が内容を確認し、利用規約に反するものは24時間以内に非表示にします。
            </p>
            <p>通報したものは、あなたの画面には表示されなくなります。</p>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-[#2a5540] py-3 text-sm font-bold text-white"
            >
              閉じる
            </button>
          </div>
        ) : needsLogin ? (
          <div className="mt-3 space-y-4 text-sm text-[#4a4238]">
            <p>通報するにはログインしてください。</p>
            <Link
              href={`/auth?next=${encodeURIComponent(loginNext)}`}
              className="block w-full rounded-xl bg-[#2a5540] py-3 text-center text-sm font-bold text-white"
            >
              ログイン / 新規登録
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-3 space-y-4">
            <fieldset>
              <legend className="text-xs font-semibold text-[#6a6258]">理由を選んでください</legend>
              <div className="mt-2 space-y-1.5">
                {REASONS.map((r) => (
                  <label
                    key={r.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm ${
                      reason === r.value
                        ? "border-[#2a5540] bg-[#eef5f0]"
                        : "border-[#e6ddd0]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={() => setReason(r.value)}
                      className="accent-[#2a5540]"
                    />
                    {r.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block">
              <span className="text-xs font-semibold text-[#6a6258]">くわしい内容（任意）</span>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                rows={2}
                maxLength={1000}
                className="mt-1 w-full rounded-xl border border-[#e6ddd0] px-3 py-2 text-sm"
              />
            </label>
            {error ? (
              <p className="text-xs text-red-600" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={!reason || submitting}
              className="w-full rounded-xl bg-[#b3261e] py-3 text-sm font-bold text-white disabled:opacity-40"
            >
              {submitting ? "送信中…" : "通報する"}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
