"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { parseCheckinQr } from "@/lib/checkin/parse-checkin-qr";
import { useQrCamera } from "@/hooks/use-qr-camera";
import { PlayResumeCard } from "@/components/play/PlayResume";

export default function CheckinScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [statusMessage, setStatusMessage] = useState("QRコードを枠内に合わせてください");

  /** true を返すとカメラを止める。読めないコードや受付コードの不一致は、そのまま読み続ける。 */
  const handleScanResult = useCallback(
    async (raw: string): Promise<boolean> => {
      const parsed = parseCheckinQr(raw);
      if (!parsed) {
        setStatusMessage("このQRコードには対応していません。受付やゲームのQRコードを読み取ってください");
        return false;
      }

      if (parsed.type === "play") {
        setStatusMessage("読み取りました。ゲーム画面へ移動します…");
        router.push(parsed.path);
        return true;
      }

      if (parsed.type === "token") {
        setStatusMessage("読み取りました。受付画面へ移動します…");
        router.push(`/checkin/t/${parsed.token}`);
        return true;
      }

      try {
        const res = await fetch(`/api/checkin/code/${parsed.code}`);
        if (res.ok) {
          const data = await res.json();
          setStatusMessage("読み取りました。受付画面へ移動します…");
          router.push(`/checkin/t/${data.token}`);
          return true;
        }
        setStatusMessage("受付コードが見つかりません。もう一度お試しください。");
      } catch {
        setStatusMessage("通信エラーが発生しました。もう一度お試しください。");
      }
      return false;
    },
    [router],
  );

  const { state: scanState, stop: stopCamera } = useQrCamera(videoRef, handleScanResult);
  const shownMessage = scanState === "starting" ? "カメラを起動しています…" : statusMessage;

  return (
    <div
      className="flex min-h-screen flex-col pb-[calc(72px+env(safe-area-inset-bottom,0px))]"
      style={{
        backgroundColor: "#172033",
        backgroundImage: "url(/assets/machiglyph/checkin/backgrounds/machi_pattern_background.svg)",
        backgroundRepeat: "repeat",
        backgroundSize: "160px",
      }}
    >
      <header className="flex items-center gap-3 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
        <Link
          href="/checkin"
          onClick={stopCamera}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
          aria-label="戻る"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-[16px] font-bold text-white">QRコードを読み取る</h1>
          <p className="text-[11px] text-white/70">会場やゲームのQRコードを枠内に合わせてください</p>
        </div>
      </header>

      <div className="relative mx-4 flex flex-1 flex-col overflow-hidden rounded-[20px] bg-black">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          playsInline
          muted
          autoPlay
        />

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-6">
          <div className="relative aspect-square w-full max-w-[280px]">
            <div className="absolute inset-0 rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
            <span className="absolute -left-0.5 -top-0.5 h-6 w-6 rounded-tl-lg border-l-4 border-t-4 border-[#d49a25]" />
            <span className="absolute -right-0.5 -top-0.5 h-6 w-6 rounded-tr-lg border-r-4 border-t-4 border-[#d49a25]" />
            <span className="absolute -bottom-0.5 -left-0.5 h-6 w-6 rounded-bl-lg border-b-4 border-l-4 border-[#d49a25]" />
            <span className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-br-lg border-b-4 border-r-4 border-[#d49a25]" />
          </div>

          <p className="mt-6 text-center text-[13px] font-medium text-white">{shownMessage}</p>
        </div>

        {(scanState === "unsupported" || scanState === "denied" || scanState === "error") && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#172033]/90 p-6">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center">
              <Image
                src="/assets/machiglyph/checkin/icons/camera_scan_icon.svg"
                width={40}
                height={40}
                alt=""
                className="mx-auto opacity-70"
              />
              <h2 className="mt-3 text-[15px] font-bold text-[#172033]">
                {scanState === "denied"
                  ? "カメラの使用が許可されていません"
                  : scanState === "unsupported"
                    ? "このブラウザではカメラを利用できません"
                    : "カメラを起動できませんでした"}
              </h2>
              <p className="mt-2 text-[12px] leading-relaxed text-[#607083]">
                {scanState === "denied"
                  ? "ブラウザの設定でカメラを許可するか、受付コードの入力をお試しください。"
                  : "受付コードを手入力してチェックインできます。"}
              </p>
              <Link
                href="/checkin"
                className="mt-4 block rounded-xl bg-[#2d4635] py-3 text-[13px] font-bold text-white"
              >
                受付コードを入力する
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 px-4 py-4">
        <PlayResumeCard tone="dark" />
        <Link
          href="/checkin"
          onClick={stopCamera}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 text-[13px] font-semibold text-white"
        >
          <Image
            src="/assets/machiglyph/checkin/icons/keyboard_code_icon.svg"
            width={16}
            height={16}
            alt=""
            className="brightness-[10]"
          />
          受付コードを入力
        </Link>
      </div>
    </div>
  );
}
