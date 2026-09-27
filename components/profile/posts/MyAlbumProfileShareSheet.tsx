"use client";

import { useCallback, useEffect, useRef, useState, type Ref } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Check, Download, Link2, ScanLine, Upload, X } from "lucide-react";
import jsQR from "jsqr";

const LOGO = "/auth/brand-mark.png";

const PALETTES = [
  { from: "#1f7a4d", to: "#7ec8d4", qr: "#1b6b45" },
  { from: "#b8863d", to: "#ead7a0", qr: "#8a6320" },
  { from: "#3d6b8a", to: "#9fd0c8", qr: "#2d5570" },
  { from: "#a45c4a", to: "#e8c4a8", qr: "#7a3d32" },
] as const;

function parseAlbumPath(raw: string): string | null {
  const text = raw.trim();
  const match = text.match(/\/users\/([^/?#]+)\/album\/?/);
  if (!match) return null;
  return `/users/${match[1]}/album`;
}

function downloadQr(svg: SVGSVGElement, filename: string) {
  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 760;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const img = new window.Image();
  img.onload = () => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const size = 520;
    const x = (canvas.width - size) / 2;
    ctx.drawImage(img, x, 48, size, size);
    const a = document.createElement("a");
    a.download = filename;
    a.href = canvas.toDataURL("image/png");
    a.click();
  };
  img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
}

export function MyAlbumProfileShareSheet({
  open,
  onClose,
  path,
  handle,
  displayName,
}: {
  open: boolean;
  onClose: () => void;
  path: string;
  handle: string;
  displayName: string;
}) {
  const router = useRouter();
  const qrRef = useRef<SVGSVGElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [url, setUrl] = useState("");
  const [palette, setPalette] = useState(0);
  const [copied, setCopied] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanHint, setScanHint] = useState("QRを枠に合わせてください");

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setUrl(`${window.location.origin}${path}`);
    setCopied(false);
    setScanning(false);
    setPalette(0);
  }, [open, path]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      stopCamera();
    };
  }, [open, onClose, stopCamera]);

  useEffect(() => {
    if (!open || !scanning) {
      stopCamera();
      return;
    }

    let cancelled = false;
    scanningRef.current = true;
    setScanHint("カメラを起動しています…");

    const tick = () => {
      const video = videoRef.current;
      if (!scanningRef.current || !video || video.readyState < 2) {
        if (scanningRef.current) requestAnimationFrame(tick);
        return;
      }
      if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        requestAnimationFrame(tick);
        return;
      }
      ctx.drawImage(video, 0, 0);
      const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(image.data, image.width, image.height, {
        inversionAttempts: "dontInvert",
      });
      if (code?.data) {
        const albumPath = parseAlbumPath(code.data);
        if (albumPath) {
          stopCamera();
          onClose();
          router.push(albumPath);
          return;
        }
        setScanHint("マイアルバムのQRではありません");
      }
      requestAnimationFrame(tick);
    };

    void (async () => {
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
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setScanHint("QRを枠に合わせてください");
        requestAnimationFrame(tick);
      } catch {
        if (!cancelled) setScanHint("カメラを使えませんでした");
      }
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open, scanning, onClose, router, stopCamera]);

  const copyLink = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const shareProfile = async () => {
    if (!url) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${displayName} | MachiGlyph`,
          text: `${displayName}のマイアルバム`,
          url,
        });
        return;
      }
    } catch {
      // user cancelled or share unsupported
    }
    await copyLink();
  };

  if (!mounted || !open) return null;

  const theme = PALETTES[palette % PALETTES.length];
  const label = `@${handle.replace(/^@/, "").toUpperCase()}`;

  return createPortal(
    <div
      className="mg-album-qr"
      style={{ background: `linear-gradient(165deg, ${theme.from} 0%, ${theme.to} 100%)` }}
      role="dialog"
      aria-modal="true"
      aria-label="プロフィールをシェア"
    >
      <div className="mg-album-qr__top">
        <button type="button" className="mg-album-qr__round" onClick={onClose} aria-label="閉じる">
          <X className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="mg-album-qr__color"
          onClick={() => setPalette((n) => (n + 1) % PALETTES.length)}
        >
          カラー
        </button>
        <button
          type="button"
          className="mg-album-qr__round"
          onClick={() => setScanning((v) => !v)}
          aria-label={scanning ? "QR表示に戻る" : "QRを読み取る"}
          aria-pressed={scanning}
        >
          <ScanLine className="h-5 w-5" />
        </button>
      </div>

      {scanning ? (
        <div className="mg-album-qr__scan">
          <video ref={videoRef} className="mg-album-qr__video" playsInline muted />
          <span className="mg-album-qr__frame" aria-hidden />
          <p className="mg-album-qr__hint">{scanHint}</p>
        </div>
      ) : (
        <>
          <div className="mg-album-qr__stage">
            <div className="mg-album-qr__card">
              <div className="mg-album-qr__code">
                {url ? (
                  <QRCodeSVG
                    value={url}
                    size={232}
                    level="H"
                    fgColor={theme.qr}
                    bgColor="#ffffff"
                    ref={qrRef as Ref<SVGSVGElement>}
                  />
                ) : (
                  <span className="mg-album-qr__placeholder" />
                )}
                <span className="mg-album-qr__logo" aria-hidden>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={LOGO} alt="" />
                </span>
              </div>
              <p className="mg-album-qr__handle" style={{ color: theme.qr }}>
                {label}
              </p>
            </div>
          </div>

          <div className="mg-album-qr__actions">
            <button type="button" className="mg-album-qr__act" onClick={() => void shareProfile()}>
              <Upload className="h-5 w-5" aria-hidden />
              プロフィールをシェア
            </button>
            <button type="button" className="mg-album-qr__act" onClick={() => void copyLink()}>
              {copied ? <Check className="h-5 w-5" aria-hidden /> : <Link2 className="h-5 w-5" aria-hidden />}
              {copied ? "コピーした" : "リンクをコピー"}
            </button>
            <button
              type="button"
              className="mg-album-qr__act"
              onClick={() => {
                if (qrRef.current) downloadQr(qrRef.current, `machiglyph-${handle}-qr.png`);
              }}
            >
              <Download className="h-5 w-5" aria-hidden />
              ダウンロード
            </button>
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}
