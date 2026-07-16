"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import jsQR from "jsqr";
import { Check, Keyboard, RotateCcw, ScanLine } from "lucide-react";
import { Modal } from "./day-management-shared";
import { parsePassQr } from "@/lib/checkin/parse-pass-qr";

type ScanState = "starting" | "scanning" | "unsupported" | "denied" | "error";
type ResultState =
  | {
      kind: "ok";
      name: string;
      receptionNumber: string;
      alreadyCheckedIn: boolean;
      passKind: "visitor" | "volunteer";
    }
  | { kind: "error"; message: string }
  | null;

type Props = {
  open: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
};

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => {
      detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
    };
  }
}

export function CheckinQrScanModal({ open, onClose, eventId, eventTitle }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const handledRef = useRef(false);

  const [scanState, setScanState] = useState<ScanState>("starting");
  const [statusMessage, setStatusMessage] = useState("カメラを起動しています…");
  const [result, setResult] = useState<ResultState>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const resetForNextScan = useCallback(() => {
    handledRef.current = false;
    submittingRef.current = false;
    setSubmitting(false);
    setResult(null);
    setStatusMessage("QRコードを枠内に合わせてください");
    setScanState("starting");
    setManualOpen(false);
    setManualCode("");
  }, []);

  const submitQr = useCallback(
    async (raw: string) => {
      if (!eventId || submittingRef.current) return;
      const parsed = parsePassQr(raw);
      if (!parsed) {
        handledRef.current = false;
        setStatusMessage("参加パスのQRとして認識できません。もう一度お試しください。");
        return;
      }

      submittingRef.current = true;
      setSubmitting(true);
      setStatusMessage("受付処理中…");
      try {
        const res = await fetch(`/api/organizer/events/${eventId}/checkin/scan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qr: raw.trim() }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          stopCamera();
          setResult({
            kind: "error",
            message: typeof data.error === "string" ? data.error : "受付に失敗しました",
          });
          return;
        }
        stopCamera();
        setResult({
          kind: "ok",
          name: data.name ?? (data.kind === "volunteer" ? "スタッフ" : "来場者"),
          receptionNumber: data.receptionNumber ?? "",
          alreadyCheckedIn: Boolean(data.alreadyCheckedIn),
          passKind: data.kind === "volunteer" ? "volunteer" : "visitor",
        });
      } catch {
        handledRef.current = false;
        setStatusMessage("通信エラーが発生しました。もう一度お試しください。");
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [eventId, stopCamera]
  );

  const handleScanResult = useCallback(
    async (raw: string) => {
      if (handledRef.current || result) return;
      if (!parsePassQr(raw)) return;
      handledRef.current = true;
      await submitQr(raw);
    },
    [result, submitQr]
  );

  useEffect(() => {
    if (!open) {
      stopCamera();
      handledRef.current = false;
      setResult(null);
      setScanState("starting");
      setStatusMessage("カメラを起動しています…");
      setManualOpen(false);
      setManualCode("");
      setSubmitting(false);
    }
  }, [open, stopCamera]);

  useEffect(() => {
    if (!open || !eventId || result || manualOpen) return;

    let cancelled = false;
    let frameId = 0;

    const detectWithJsQr = (video: HTMLVideoElement): string | null => {
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) return null;

      if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
      const canvas = canvasRef.current;
      const maxSide = 480;
      const scale = Math.min(1, maxSide / Math.max(w, h));
      const cw = Math.max(1, Math.round(w * scale));
      const ch = Math.max(1, Math.round(h * scale));
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, cw, ch);
      const imageData = ctx.getImageData(0, 0, cw, ch);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      return code?.data ?? null;
    };

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
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

        const useNative = typeof window.BarcodeDetector === "function";
        const detector = useNative
          ? new window.BarcodeDetector!({ formats: ["qr_code"] })
          : null;

        setScanState("scanning");
        setStatusMessage("参加パスのQRを枠内に合わせてください");

        const scheduleNext = () => {
          if (cancelled || handledRef.current) return;
          if (detector) {
            frameId = requestAnimationFrame(scanFrame);
          } else {
            frameId = window.setTimeout(() => {
              frameId = requestAnimationFrame(scanFrame);
            }, 120) as unknown as number;
          }
        };

        const scanFrame = async () => {
          if (cancelled || handledRef.current) return;
          if (!video.videoWidth || scanningRef.current) {
            scheduleNext();
            return;
          }

          scanningRef.current = true;
          try {
            let raw: string | null = null;
            if (detector) {
              const codes = await detector.detect(video);
              raw = codes[0]?.rawValue ?? null;
            } else {
              raw = detectWithJsQr(video);
            }
            if (raw) await handleScanResult(raw);
          } catch {
            // フレーム単位の失敗は無視
          } finally {
            scanningRef.current = false;
          }

          scheduleNext();
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
      clearTimeout(frameId);
      stopCamera();
    };
  }, [open, eventId, result, manualOpen, handleScanResult, stopCamera]);

  if (!eventId) {
    return (
      <Modal open={open} onClose={onClose} title="受付QRコード読み取り">
        <div className="rounded-xl bg-[#F5F8F5] p-5 text-center">
          <p className="text-[13px] font-medium text-[#1A2214]">
            QRを読み取るには、先にイベントを作成または選択してください。
          </p>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <Link
            href="/organizer/events/new"
            onClick={onClose}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2D7A4F] py-2.5 text-[13px] font-medium text-white"
          >
            イベントを作成する
          </Link>
          <Link
            href="/organizer/events"
            onClick={onClose}
            className="inline-flex w-full items-center justify-center rounded-xl border border-[#DDE8DF] bg-[#F5F8F5] py-2.5 text-[13px] font-medium text-[#566358]"
          >
            イベント管理へ
          </Link>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="受付QRコード読み取り">
      <p className="mb-3 text-[13px] leading-relaxed text-[#566358]">
        {eventTitle
          ? `「${eventTitle}」の参加パスQRを読み取って受付します（来場者・スタッフ共通）。`
          : "参加パスQRを読み取って受付します（来場者・スタッフ共通）。"}
      </p>

      {result?.kind === "ok" ? (
        <div className="rounded-xl border border-[#DDE8DF] bg-[#EAF4ED] p-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white">
            <Check size={24} className="text-[#2D7A4F]" />
          </div>
          <p className="mt-3 text-[15px] font-bold text-[#1A2214]">
            {result.alreadyCheckedIn
              ? "すでに受付済みです"
              : result.passKind === "volunteer"
                ? "スタッフ受付完了"
                : "来場受付完了"}
          </p>
          <p className="mt-1 text-[18px] font-bold text-[#1A2214]">{result.name}</p>
          {result.passKind === "volunteer" ? (
            <p className="mt-1 text-[11px] font-medium text-[#2D7A4F]">ボランティア</p>
          ) : null}
          {result.receptionNumber ? (
            <p className="mt-1 font-mono text-[12px] tracking-wide text-[#566358]">
              {result.receptionNumber}
            </p>
          ) : null}
          <button
            type="button"
            onClick={resetForNextScan}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2D7A4F] py-2.5 text-[13px] font-medium text-white"
          >
            <RotateCcw size={14} />
            続けて読み取る
          </button>
        </div>
      ) : result?.kind === "error" ? (
        <div className="rounded-xl border border-[#FFCDD2] bg-[#FFEBEE] p-5 text-center">
          <p className="text-[14px] font-bold text-[#E53935]">受付できませんでした</p>
          <p className="mt-2 text-[13px] leading-relaxed text-[#1A2214]">{result.message}</p>
          <button
            type="button"
            onClick={resetForNextScan}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2D7A4F] py-2.5 text-[13px] font-medium text-white"
          >
            <RotateCcw size={14} />
            もう一度読み取る
          </button>
        </div>
      ) : manualOpen ? (
        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-[#566358]">
            受付番号（例: MG-A1B2C3D4）
          </label>
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            placeholder="MG-"
            className="w-full rounded-xl border border-[#DDE8DF] bg-[#F5F8F5] px-3 py-2.5 font-mono text-[15px] tracking-wider text-[#1A2214] placeholder:text-[#566358]/50 focus:border-[#2D7A4F] focus:outline-none focus:ring-2 focus:ring-[#2D7A4F]/20"
            autoComplete="off"
            autoCapitalize="characters"
          />
          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              disabled={!parsePassQr(manualCode.trim()) || submitting}
              onClick={() => {
                handledRef.current = true;
                void submitQr(manualCode.trim());
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2D7A4F] py-2.5 text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "処理中..." : "受付する"}
            </button>
            <button
              type="button"
              onClick={() => {
                setManualOpen(false);
                handledRef.current = false;
                setScanState("starting");
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#DDE8DF] bg-[#F5F8F5] py-2.5 text-[13px] font-medium text-[#566358]"
            >
              <ScanLine size={14} />
              カメラで読み取る
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="relative overflow-hidden rounded-xl bg-[#172033]">
            <div className="relative aspect-[4/3] w-full">
              <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-cover"
                playsInline
                muted
                autoPlay
              />
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="relative aspect-square w-full max-w-[200px]">
                  <div className="absolute inset-0 rounded-xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
                  <span className="absolute -left-0.5 -top-0.5 h-5 w-5 rounded-tl-md border-l-[3px] border-t-[3px] border-[#2D7A4F]" />
                  <span className="absolute -right-0.5 -top-0.5 h-5 w-5 rounded-tr-md border-r-[3px] border-t-[3px] border-[#2D7A4F]" />
                  <span className="absolute -bottom-0.5 -left-0.5 h-5 w-5 rounded-bl-md border-b-[3px] border-l-[3px] border-[#2D7A4F]" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-br-md border-b-[3px] border-r-[3px] border-[#2D7A4F]" />
                </div>
              </div>
            </div>
            <p className="px-3 py-2.5 text-center text-[12px] font-medium text-white">
              {statusMessage}
            </p>

            {(scanState === "unsupported" || scanState === "denied" || scanState === "error") && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#172033]/92 p-4">
                <div className="w-full rounded-xl bg-white p-4 text-center">
                  <p className="text-[13px] font-bold text-[#1A2214]">
                    {scanState === "denied"
                      ? "カメラの使用が許可されていません"
                      : scanState === "unsupported"
                        ? "このブラウザではカメラを利用できません"
                        : "カメラを起動できませんでした"}
                  </p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-[#566358]">
                    受付番号を手入力して受付できます。
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setManualOpen(true);
                    }}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2D7A4F] py-2.5 text-[13px] font-medium text-white"
                  >
                    <Keyboard size={14} />
                    受付番号を入力
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setManualOpen(true);
            }}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#DDE8DF] bg-[#F5F8F5] py-2.5 text-[12px] font-medium text-[#566358]"
          >
            <Keyboard size={13} />
            受付番号を手入力
          </button>
        </>
      )}
    </Modal>
  );
}
