"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
    <div className="min-h-screen bg-[#f5f8f5] pb-24">
      <div className="relative overflow-hidden bg-[#315c4b] px-4 pb-8 pt-12">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "url(/assets/machiglyph/checkin/backgrounds/machi_pattern_background.svg)",
            backgroundSize: "200px",
          }}
        />
        <div className="relative z-10 mx-auto max-w-sm text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-medium text-white">
            <Image
              src="/assets/machiglyph/checkin/icons/checkin_qr_icon.svg"
              width={14}
              height={14}
              alt=""
              className="brightness-[10]"
            />
            チェックイン
          </span>
          <h1 className="mt-3 text-2xl font-bold text-white">チェックイン</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-white/80">
            イベント会場のQRコードを読み取って
            <br />
            受付を完了できます。
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-sm px-4 -mt-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-[#d8e3dc]">
          <div className="flex justify-center mb-5">
            <Image
              src="/assets/machiglyph/checkin/illustrations/checkin_qr_hero_card.png"
              width={160}
              height={120}
              alt="QRコード読み取り"
              className="rounded-xl object-contain"
            />
          </div>

          <button
            type="button"
            onClick={() => router.push("/checkin/scan")}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c28f13] py-3.5 text-[15px] font-bold text-white shadow-sm active:scale-[0.98]"
          >
            <Image
              src="/assets/machiglyph/checkin/icons/camera_scan_icon.svg"
              width={20}
              height={20}
              alt=""
              className="brightness-[10]"
            />
            QRコードを読み取る
          </button>

          <button
            type="button"
            onClick={() => setShowCodeInput((v) => !v)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#d8e3dc] bg-[#eef6f0] py-3 text-[14px] font-medium text-[#315c4b] active:scale-[0.98]"
          >
            <Image
              src="/assets/machiglyph/checkin/icons/keyboard_code_icon.svg"
              width={18}
              height={18}
              alt=""
              className="opacity-70"
            />
            受付コードを入力
          </button>

          {showCodeInput && (
            <form onSubmit={handleCodeSubmit} className="mt-4">
              <label className="block text-[12px] font-medium text-[#315c4b] mb-1">
                受付コード（例：A7K9P2）
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="受付コードを入力"
                maxLength={8}
                className="w-full rounded-xl border border-[#d8e3dc] bg-[#f5f8f5] px-4 py-3 text-[15px] font-mono tracking-widest text-[#172033] placeholder:text-[#607083]/50 focus:border-[#315c4b] focus:outline-none focus:ring-2 focus:ring-[#315c4b]/20"
              />
              {codeError && (
                <p className="mt-1.5 text-[12px] text-red-600">{codeError}</p>
              )}
              <button
                type="submit"
                disabled={!code.trim() || submitting}
                className="mt-3 w-full rounded-xl bg-[#315c4b] py-3 text-[14px] font-bold text-white disabled:opacity-50"
              >
                {submitting ? "確認中..." : "受付に進む"}
              </button>
            </form>
          )}
        </div>

        <div className="mt-5 rounded-2xl bg-white p-5 border border-[#d8e3dc]">
          <h2 className="text-[13px] font-bold text-[#172033] mb-4">チェックインの流れ</h2>
          <div className="space-y-3">
            {[
              {
                step: 1,
                icon: "/assets/machiglyph/checkin/icons/camera_scan_icon.svg",
                title: "QRを読み取る",
                desc: "会場に掲示されたQRコードをスキャン",
              },
              {
                step: 2,
                icon: "/assets/machiglyph/checkin/icons/keyboard_code_icon.svg",
                title: "内容を確認",
                desc: "イベント情報とお名前を確認",
              },
              {
                step: 3,
                icon: "/assets/machiglyph/checkin/icons/check_circle_icon.svg",
                title: "受付完了",
                desc: "ボタンを押して受付完了",
              },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#315c4b] text-[11px] font-bold text-white">
                  {step}
                </div>
                <div className="flex items-start gap-2.5 min-w-0">
                  <Image src={icon} width={16} height={16} alt="" className="mt-0.5 shrink-0 opacity-60" />
                  <div>
                    <p className="text-[13px] font-semibold text-[#172033]">{title}</p>
                    <p className="text-[11px] text-[#607083]">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 text-center text-[12px] text-[#607083]">
          ログインすると参加履歴に保存されます
        </p>
      </div>
    </div>
  );
}
