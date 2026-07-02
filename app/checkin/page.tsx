"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const FLOW_STEPS = [
  {
    step: 1,
    icon: "/assets/machiglyph/checkin/icons/camera_scan_icon.svg",
    label: "QRを読み取る",
  },
  {
    step: 2,
    icon: "/assets/machiglyph/checkin/icons/keyboard_code_icon.svg",
    label: "内容を確認",
  },
  {
    step: 3,
    icon: "/assets/machiglyph/checkin/icons/check_circle_icon.svg",
    label: "受付完了",
  },
] as const;

export default function CheckinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    <div className="relative overflow-x-hidden">
      {/* 背景 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(165deg, #f8faf7 0%, #eef4f0 42%, #f5f0e6 100%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "url(/assets/machiglyph/checkin/backgrounds/machi_pattern_background.svg)",
          backgroundRepeat: "repeat",
          backgroundSize: "140px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#c9a227]/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-10 bottom-32 h-40 w-40 rounded-full bg-[#2d4635]/8 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-[400px] px-5 pb-6 pt-6">
        {/* ヘッダー */}
        <header>
          <p className="flex items-center gap-1.5 text-[10px] font-medium tracking-[0.14em] text-[#607083]">
            <Image
              src="/assets/machiglyph/checkin/icons/checkin_qr_icon.svg"
              width={12}
              height={12}
              alt=""
              className="opacity-60"
            />
            CHECK-IN
          </p>
          <h1 className="mt-2 font-serif text-[26px] font-medium leading-tight tracking-tight text-[#172033]">
            チェックイン
          </h1>
          <div className="mt-2.5 h-px w-10 bg-gradient-to-r from-[#c28f13] to-transparent" />
          <p className="mt-3 max-w-[28ch] text-[13px] leading-[1.75] text-[#607083]">
            会場のQRコードを読み取って、
            <br />
            スムーズに受付を完了できます。
          </p>
        </header>

        {/* ヒーロー */}
        <div className="relative mt-7">
          <div
            className="absolute inset-x-6 bottom-0 top-8 rounded-[28px] bg-[#2d4635]/6 blur-2xl"
            aria-hidden
          />
          <div className="relative overflow-hidden rounded-[22px] shadow-[0_12px_40px_rgba(45,70,53,0.12)] ring-1 ring-white/60">
            <Image
              src="/assets/machiglyph/checkin/illustrations/checkin_qr_hero_card.png"
              width={721}
              height={360}
              alt="QRコード読み取りのイラスト"
              className="h-auto w-full"
              priority
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#f5f0e6]/80 to-transparent" />
          </div>
        </div>

        {/* アクション */}
        <div className="mt-7 space-y-3">
          <button
            type="button"
            onClick={() => router.push("/checkin/scan")}
            className="group flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-[#d4a02a] via-[#c28f13] to-[#b07d0f] px-6 text-[14px] font-semibold tracking-wide text-white shadow-[0_8px_24px_rgba(194,143,19,0.28)] transition active:scale-[0.98] active:shadow-[0_4px_12px_rgba(194,143,19,0.2)]"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
              <Image
                src="/assets/machiglyph/checkin/icons/camera_scan_icon.svg"
                width={15}
                height={15}
                alt=""
                className="brightness-[10]"
              />
            </span>
            QRコードを読み取る
          </button>

          <button
            type="button"
            onClick={() => setShowCodeInput((v) => !v)}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-[#2d4635]/20 bg-white/50 text-[13px] font-medium text-[#2d4635] backdrop-blur-sm transition hover:border-[#2d4635]/35 hover:bg-white/70 active:scale-[0.98]"
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
            className="mt-4 space-y-3 rounded-2xl border border-[#d8e3dc]/80 bg-white/70 p-4 backdrop-blur-sm"
          >
            <label className="block text-[11px] font-medium tracking-wide text-[#607083]">
              受付コード
              <span className="ml-1.5 font-mono text-[#2d4635]">A7K9P2</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="コードを入力"
              maxLength={8}
              className="w-full rounded-xl border border-[#d8e3dc] bg-white px-4 py-3 text-center font-mono text-[16px] tracking-[0.3em] text-[#172033] placeholder:tracking-normal placeholder:text-[#607083]/40 focus:border-[#2d4635] focus:outline-none focus:ring-2 focus:ring-[#2d4635]/15"
            />
            {codeError && (
              <p className="text-center text-[11px] text-red-600">{codeError}</p>
            )}
            <button
              type="submit"
              disabled={!code.trim() || submitting}
              className="w-full rounded-full bg-[#2d4635] py-3 text-[13px] font-semibold text-white shadow-[0_4px_14px_rgba(45,70,53,0.2)] disabled:opacity-50"
            >
              {submitting ? "確認中..." : "受付に進む"}
            </button>
          </form>
        )}

        {/* 流れ */}
        <section className="mt-8" aria-label="チェックインの流れ">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#d8e3dc]" />
            <p className="shrink-0 text-[10px] font-medium tracking-[0.12em] text-[#607083]">
              FLOW
            </p>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#d8e3dc]" />
          </div>

          <ol className="relative flex justify-between">
            <div
              className="absolute left-[16%] right-[16%] top-[11px] h-px bg-gradient-to-r from-[#d8e3dc] via-[#b0c4b8] to-[#d8e3dc]"
              aria-hidden
            />
            {FLOW_STEPS.map(({ step, icon, label }) => (
              <li
                key={step}
                className="relative flex w-[30%] flex-col items-center gap-2 text-center"
              >
                <div className="relative flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#f5f8f5] ring-2 ring-[#eef4f0]">
                  <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#2d4635] text-[9px] font-bold text-white">
                    {step}
                  </div>
                </div>
                <Image src={icon} width={14} height={14} alt="" className="opacity-70" />
                <span className="text-[10px] font-medium leading-snug text-[#2d4635]">
                  {label}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-[10px] text-[#607083]/80">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 shrink-0 opacity-60"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          ログインすると参加履歴に保存されます
        </p>
      </div>
    </div>
  );
}
