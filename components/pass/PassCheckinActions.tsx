"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

/**
 * 参加パス画面の上に置く「QRを読み取る」「受付コードを入力」。
 * もとはチェックイン画面（/checkin）にあったもの。ログインしていなくても使える。
 */
export function PassCheckinActions({ className }: Props) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 読み取り画面の「受付コードを入力」から来たとき（/pass?code=1）は、入力欄を開いておく
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("code") === "1") setShowCodeInput(true);
  }, []);

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setSubmitting(true);
    setCodeError("");
    try {
      const res = await fetch(`/api/checkin/code/${code.trim().toUpperCase()}`);
      if (res.ok) {
        const data = await res.json();
        router.push(`/checkin/t/${data.token}`);
      } else {
        setCodeError("受付コードが見つかりません。正しいコードを入力してください。");
      }
    } catch {
      setCodeError("エラーが発生しました。もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section aria-label="会場で受付する" className={cn("space-y-2", className)}>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => router.push("/checkin/scan")}
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#2f7d4e] px-3 text-[13px] font-semibold text-white shadow-[0_6px_16px_rgba(47,125,78,0.22)] transition active:scale-[0.98]"
        >
          <Image
            src="/assets/machiglyph/checkin/icons/camera_scan_icon.svg"
            width={15}
            height={15}
            alt=""
            className="brightness-[10]"
          />
          QRを読み取る
        </button>
        <button
          type="button"
          onClick={() => setShowCodeInput((v) => !v)}
          aria-expanded={showCodeInput}
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-[#2f7d4e]/25 bg-white px-3 text-[13px] font-medium text-[#2f7d4e] transition active:scale-[0.98]"
        >
          <Image
            src="/assets/machiglyph/checkin/icons/keyboard_code_icon.svg"
            width={15}
            height={15}
            alt=""
            className="opacity-80"
          />
          受付コードを入力
        </button>
      </div>

      {showCodeInput && (
        <form
          onSubmit={handleCodeSubmit}
          className="space-y-3 rounded-2xl border border-[#d8e3dc] bg-white p-4"
        >
          <label
            htmlFor="pass-checkin-code"
            className="block text-[11px] font-medium tracking-wide text-[#5a665c]"
          >
            受付コード
            <span className="ml-1.5 font-mono text-[#2f7d4e]">例：A7K9P2</span>
          </label>
          <input
            id="pass-checkin-code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="コードを入力"
            maxLength={8}
            autoComplete="off"
            className="w-full rounded-xl border border-[#d8e3dc] bg-white px-4 py-3 text-center font-mono text-[16px] tracking-[0.3em] text-[#1a2818] placeholder:tracking-normal placeholder:text-[#5a665c]/50 focus:border-[#2f7d4e] focus:outline-none focus:ring-2 focus:ring-[#2f7d4e]/15"
          />
          {codeError && <p className="text-center text-[11px] text-red-600">{codeError}</p>}
          <button
            type="submit"
            disabled={!code.trim() || submitting}
            className="w-full rounded-full bg-[#2f7d4e] py-3 text-[13px] font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "確認中..." : "受付に進む"}
          </button>
        </form>
      )}
    </section>
  );
}
