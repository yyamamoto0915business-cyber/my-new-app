"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, Copy, ExternalLink, Check, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Modal } from "./day-management-shared";

type CheckinData = {
  token: string;
  code: string;
  checkinUrl: string;
  checkinEnabled: boolean;
  checkinCount: number;
  list: { id: string; name: string; checkedInAt: string; type: "login" | "guest" }[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
};

export function CheckinQrModal({ open, onClose, eventId, eventTitle }: Props) {
  const [data, setData] = useState<CheckinData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<SVGSVGElement>(null);

  const load = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/organizer/events/${eventId}/checkin`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (open && eventId) load();
  }, [open, eventId, load]);

  const handleCopy = async () => {
    if (!data?.checkinUrl) return;
    await navigator.clipboard.writeText(data.checkinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current;
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
      a.download = `checkin-qr-${eventId}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  };

  // イベント未選択
  if (!eventId) {
    return (
      <Modal open={open} onClose={onClose} title="受付QRコード">
        <div className="rounded-xl bg-[#F5F8F5] p-5 text-center">
          <p className="text-[13px] font-medium text-[#1A2214]">QRコードを表示するには、先にイベントを作成または選択してください。</p>
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
    <Modal open={open} onClose={onClose} title="受付QRコード">
      <p className="mb-4 text-[13px] text-[#566358]">
        来場者にこのQRコードを読み取ってもらうことで、イベント受付を完了できます。
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#2D7A4F] border-t-transparent" />
        </div>
      ) : data ? (
        <>
          <div className="rounded-xl border border-[#DDE8DF] bg-[#EAF4ED] p-5 flex flex-col items-center gap-3">
            <div className="rounded-xl bg-white p-3 shadow-sm">
              <QRCodeSVG
                ref={qrRef as React.Ref<SVGSVGElement>}
                value={data.checkinUrl}
                size={160}
                fgColor="#1A2214"
                bgColor="#ffffff"
                level="M"
              />
            </div>
            <div className="text-center">
              <p className="text-[12px] font-bold text-[#172033]">{eventTitle}</p>
              <p className="mt-0.5 text-[10px] font-mono text-[#566358]">受付コード：{data.code}</p>
            </div>
          </div>

          <div className="mt-3 rounded-lg bg-[#F5F8F5] px-3 py-2">
            <p className="text-[10px] text-[#566358] mb-0.5">受付URL</p>
            <p className="text-[11px] font-mono text-[#1A2214] break-all">{data.checkinUrl}</p>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2D7A4F] py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#245f3e]"
            >
              <Download size={15} />
              QRコードをダウンロード
            </button>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={data.checkinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#DDE8DF] bg-[#F5F8F5] py-2.5 text-[12px] font-medium text-[#566358]"
              >
                <ExternalLink size={13} />
                受付ページを開く
              </Link>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#DDE8DF] bg-[#F5F8F5] py-2.5 text-[12px] font-medium text-[#566358]"
              >
                {copied ? <Check size={13} className="text-[#2D7A4F]" /> : <Copy size={13} />}
                {copied ? "コピー済み" : "URLをコピー"}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={load}
            className="mt-2 inline-flex w-full items-center justify-center gap-1.5 py-1.5 text-[11px] text-[#566358]"
          >
            <RefreshCw size={11} />
            更新する
          </button>
        </>
      ) : (
        <p className="text-center text-[13px] text-[#566358] py-6">読み込みに失敗しました</p>
      )}
    </Modal>
  );
}
