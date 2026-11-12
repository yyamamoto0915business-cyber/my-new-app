"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, ScanLine } from "lucide-react";
import { Modal } from "@/components/organizer/day/day-management-shared";
import { useQrCamera } from "@/hooks/use-qr-camera";
import { parsePassQr } from "@/lib/checkin/parse-pass-qr";
import { looksLikePointsQr } from "@/lib/points/points-qr-format";

/** 参加パスのQR・受付番号か、ポイントの画面の「レジで見せるQR」か */
function isReadableQr(raw: string): boolean {
  return Boolean(parsePassQr(raw)) || looksLikePointsQr(raw);
}

export type PosPointsHolderView = {
  /** 読み取ったQR（会計のときにサーバーで読み直すために送る） */
  qr: string;
  name: string;
  receptionNumber: string;
  balance: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  eventId: string;
  onResolved: (holder: PosPointsHolderView) => void;
};

/** レジで参加パスのQRを読み取って、その人のこのイベントのポイントの残りを調べる */
export function PosPointsScanModal({ open, onClose, eventId, onResolved }: Props) {
  const [manual, setManual] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setManual(false);
      setCode("");
      setBusy(false);
      setError(null);
      busyRef.current = false;
    }
  }, [open]);

  const lookup = useCallback(
    async (raw: string): Promise<boolean> => {
      const qr = raw.trim();
      if (!isReadableQr(qr) || busyRef.current) return false;
      busyRef.current = true;
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/organizer/pos/points", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, qr }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(typeof json.error === "string" ? json.error : "読み取れませんでした");
          return false;
        }
        onResolved({
          qr,
          name: String(json.name ?? "参加者"),
          receptionNumber: String(json.receptionNumber ?? ""),
          balance: Math.max(0, Number(json.balance) || 0),
        });
        return true;
      } catch {
        setError("通信できませんでした。もう一度お試しください");
        return false;
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [eventId, onResolved]
  );

  return (
    <Modal open={open} onClose={onClose} title="参加パスを読み取る">
      <p className="mb-3 text-[13px] leading-relaxed text-[#566358]">
        お客さまの参加パスのQR（またはポイントの画面のQR）を読み取ると、このイベントのポイントが出ます。
      </p>
      {manual ? (
        <div>
          <label htmlFor="pos-points-code" className="mb-1.5 block text-[11px] font-medium text-[#566358]">
            受付番号（例: MG-A1B2C3D4）
          </label>
          <input
            id="pos-points-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="MG-"
            className="w-full rounded-xl border border-[#DDE8DF] bg-[#F5F8F5] px-3 py-2.5 font-mono text-[15px] tracking-wider text-[#1A2214] placeholder:text-[#566358]/50 focus:border-[#2D7A4F] focus:outline-none focus:ring-2 focus:ring-[#2D7A4F]/20"
            autoComplete="off"
            autoCapitalize="characters"
          />
          {error ? <p className="mt-2 text-[12px] font-medium text-[#C62828]">{error}</p> : null}
          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              disabled={!parsePassQr(code.trim()) || busy}
              onClick={() => void lookup(code)}
              className="inline-flex w-full items-center justify-center rounded-xl bg-[#2D7A4F] py-2.5 text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "確認中…" : "ポイントを確認する"}
            </button>
            <button
              type="button"
              onClick={() => {
                setManual(false);
                setError(null);
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#DDE8DF] bg-[#F5F8F5] py-2.5 text-[13px] font-medium text-[#566358]"
            >
              <ScanLine size={14} />
              カメラで読み取る
            </button>
          </div>
        </div>
      ) : (
        <PosPointsCamera
          active={open && !manual}
          busy={busy}
          error={error}
          onCode={lookup}
          onManual={() => {
            setManual(true);
            setError(null);
          }}
        />
      )}
    </Modal>
  );
}

function PosPointsCamera({
  active,
  busy,
  error,
  onCode,
  onManual,
}: {
  active: boolean;
  busy: boolean;
  error: string | null;
  onCode: (raw: string) => Promise<boolean>;
  onManual: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastRef = useRef<{ raw: string; at: number } | null>(null);
  // 参加パスのQRでなければ読み続ける。確認できたら止める。だめだった同じQRは3秒あける
  const { state } = useQrCamera(
    videoRef,
    (raw) => {
      if (!isReadableQr(raw)) return false;
      const now = Date.now();
      const last = lastRef.current;
      if (last && last.raw === raw && now - last.at < 3000) return false;
      lastRef.current = { raw, at: now };
      return onCode(raw);
    },
    active
  );
  const failed = state === "unsupported" || state === "denied" || state === "error";

  return (
    <>
      <div className="relative overflow-hidden rounded-xl bg-[#172033]">
        <div className="relative aspect-[4/3] w-full">
          <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" playsInline muted autoPlay />
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="aspect-square w-full max-w-[200px] rounded-xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
          </div>
        </div>
        <p className="px-3 py-2.5 text-center text-[12px] font-medium text-white">
          {busy ? "ポイントを確認しています…" : state === "starting" ? "カメラを起動しています…" : "QRを枠内に合わせてください"}
        </p>
        {failed && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#172033]/92 p-4">
            <div className="w-full rounded-xl bg-white p-4 text-center">
              <p className="text-[13px] font-bold text-[#1A2214]">
                {state === "denied" ? "カメラの使用が許可されていません" : "カメラを使えません"}
              </p>
              <button
                type="button"
                onClick={onManual}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2D7A4F] py-2.5 text-[13px] font-medium text-white"
              >
                <Keyboard size={14} />
                受付番号を入力
              </button>
            </div>
          </div>
        )}
      </div>
      {error ? <p className="mt-2 text-center text-[12px] font-medium text-[#C62828]">{error}</p> : null}
      <button
        type="button"
        onClick={onManual}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#DDE8DF] bg-[#F5F8F5] py-2.5 text-[12px] font-medium text-[#566358]"
      >
        <Keyboard size={13} />
        受付番号を手入力
      </button>
    </>
  );
}
