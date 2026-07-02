"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { parseCheckinQr } from "@/lib/checkin/parse-checkin-qr";

type ScanState = "starting" | "scanning" | "unsupported" | "denied" | "error";

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => {
      detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
    };
  }
}

export default function CheckinScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const handledRef = useRef(false);

  const [scanState, setScanState] = useState<ScanState>("starting");
  const [statusMessage, setStatusMessage] = useState("カメラを起動しています…");

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const handleScanResult = useCallback(
    async (raw: string) => {
      if (handledRef.current) return;
      const parsed = parseCheckinQr(raw);
      if (!parsed) return;

      handledRef.current = true;
      stopCamera();
      setStatusMessage("読み取りました。受付画面へ移動します…");

      if (parsed.type === "token") {
        router.push(`/checkin/t/${parsed.token}`);
        return;
      }

      try {
        const res = await fetch(`/api/checkin/code/${parsed.code}`);
        if (res.ok) {
          const data = await res.json();
          router.push(`/checkin/t/${data.token}`);
        } else {
          handledRef.current = false;
          setStatusMessage("受付コードが見つかりません。もう一度お試しください。");
        }
      } catch {
        handledRef.current = false;
        setStatusMessage("通信エラーが発生しました。もう一度お試しください。");
      }
    },
    [router, stopCamera],
  );

  useEffect(() => {
    let cancelled = false;
    let frameId = 0;

    const start = async () => {
      if (!window.BarcodeDetector) {
        setScanState("unsupported");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        await video.play();

        const detector = new window.BarcodeDetector!({ formats: ["qr_code"] });
        setScanState("scanning");
        setStatusMessage("QRコードを枠内に合わせてください");

        const scanFrame = async () => {
          if (cancelled || handledRef.current || !video.videoWidth) {
            frameId = requestAnimationFrame(scanFrame);
            return;
          }
          if (scanningRef.current) {
            frameId = requestAnimationFrame(scanFrame);
            return;
          }

          scanningRef.current = true;
          try {
            const codes = await detector.detect(video);
            if (codes[0]?.rawValue) {
              await handleScanResult(codes[0].rawValue);
            }
          } catch {
            // フレーム単位の検出失敗は無視して継続
          } finally {
            scanningRef.current = false;
          }

          frameId = requestAnimationFrame(scanFrame);
        };

        frameId = requestAnimationFrame(scanFrame);
      } catch (err) {
        const denied =
          err instanceof DOMException &&
          (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");
        setScanState(denied ? "denied" : "error");
      }
    };

    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      stopCamera();
    };
  }, [handleScanResult, stopCamera]);

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
          <p className="text-[11px] text-white/70">会場のQRコードを枠内に合わせてください</p>
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

          <p className="mt-6 text-center text-[13px] font-medium text-white">{statusMessage}</p>
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
                    ? "このブラウザではQR読み取りに対応していません"
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

      <div className="px-4 py-4">
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
