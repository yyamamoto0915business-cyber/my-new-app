"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import jsQR from "jsqr";

export type QrCameraState = "starting" | "scanning" | "unsupported" | "denied" | "error";

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => {
      detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
    };
  }
}

/**
 * 背面カメラで QR を読み続ける。BarcodeDetector があれば使い、なければ jsQR。
 * onCode が true を返したら読み取りを止めてカメラを切る。false なら読み続ける。
 */
export function useQrCamera(
  videoRef: RefObject<HTMLVideoElement | null>,
  onCode: (raw: string) => boolean | Promise<boolean>,
  active = true,
) {
  const [state, setState] = useState<QrCameraState>("starting");
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const busyRef = useRef(false);
  const doneRef = useRef(false);
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;

  const stop = useCallback(() => {
    doneRef.current = true;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, [videoRef]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let frameId = 0;
    let timerId = 0;
    doneRef.current = false;
    setState("starting");

    const detectWithJsQr = (video: HTMLVideoElement): string | null => {
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) return null;
      if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
      const canvas = canvasRef.current;
      // 処理負荷を抑えるため解像度を制限
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
        setState("unsupported");
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

        const detector =
          typeof window.BarcodeDetector === "function" ? new window.BarcodeDetector({ formats: ["qr_code"] }) : null;
        setState("scanning");

        // jsQR は CPU 負荷が高いため間引き、BarcodeDetector は毎フレーム可
        const scheduleNext = () => {
          if (cancelled || doneRef.current) return;
          if (detector) {
            frameId = requestAnimationFrame(scanFrame);
          } else {
            timerId = window.setTimeout(() => {
              frameId = requestAnimationFrame(scanFrame);
            }, 120);
          }
        };

        const scanFrame = async () => {
          if (cancelled || doneRef.current) return;
          if (!video.videoWidth || busyRef.current) {
            scheduleNext();
            return;
          }
          busyRef.current = true;
          try {
            const raw = detector ? ((await detector.detect(video))[0]?.rawValue ?? null) : detectWithJsQr(video);
            if (raw && (await onCodeRef.current(raw))) stop();
          } catch {
            // フレーム単位の検出失敗は無視して継続
          } finally {
            busyRef.current = false;
          }
          scheduleNext();
        };

        frameId = requestAnimationFrame(scanFrame);
      } catch (err) {
        const denied =
          err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");
        setState(denied ? "denied" : "error");
      }
    };

    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      clearTimeout(timerId);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [active, videoRef, stop]);

  return { state, stop };
}
