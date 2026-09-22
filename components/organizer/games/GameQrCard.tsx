"use client";

import { useEffect, useRef, useState, type Ref } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, Download } from "lucide-react";

function downloadSvg(svg: SVGSVGElement, filename: string) {
  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const img = new window.Image();
  img.onload = () => {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 400, 400);
    ctx.drawImage(img, 20, 20, 360, 360);
    const a = document.createElement("a");
    a.download = filename;
    a.href = canvas.toDataURL("image/png");
    a.click();
  };
  img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
}

export function GameQrCard({
  title,
  caption,
  path,
  filename,
  size = 132,
}: {
  title: string;
  caption?: string;
  path: string;
  filename: string;
  size?: number;
}) {
  const qrRef = useRef<SVGSVGElement>(null);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(`${window.location.origin}${path}`);
  }, [path]);

  async function copyUrl() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="org-game-qr">
      <div className="org-game-qr__code">
        {url ? (
          <QRCodeSVG
            value={url}
            size={size}
            level="M"
            fgColor="#1A2214"
            bgColor="#ffffff"
            ref={qrRef as Ref<SVGSVGElement>}
          />
        ) : (
          <span className="org-game-qr__placeholder" aria-hidden />
        )}
      </div>
      <div className="org-game-qr__meta">
        <p className="org-game-qr__title">{title}</p>
        {caption ? <p className="org-game-qr__caption">{caption}</p> : null}
        <p className="org-game-qr__url">{url || path}</p>
        <div className="org-game-qr__actions">
          <button type="button" onClick={() => void copyUrl()} disabled={!url}>
            {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
            {copied ? "コピーしました" : "URLをコピー"}
          </button>
          <button
            type="button"
            disabled={!url}
            onClick={() => {
              if (qrRef.current) downloadSvg(qrRef.current, filename);
            }}
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            画像を保存
          </button>
        </div>
      </div>
    </div>
  );
}
