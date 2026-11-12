"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type PointsInfo = {
  linked: boolean;
  eventTitle?: string;
  balance?: number;
  status?: "upcoming" | "live" | "ended" | null;
  until?: string | null;
};

const POLL_MS = 15000;

/** /play/<token> のときだけ token を返す（/play/code・/play/preview・/play/spot/… は対象外） */
function gameTokenFromPath(pathname: string | null): string | null {
  const m = pathname?.match(/^\/play\/([^/]+)\/?$/);
  if (!m) return null;
  const t = decodeURIComponent(m[1]);
  return t === "code" || t === "preview" || t === "spot" ? null : t;
}

/**
 * ゲームの画面の上に出す「このイベントのポイント」。
 * ポイントはイベントのゲームでたまり、そのイベントの開催中だけ使えるので、マイページではなくここで見せる。
 * イベントにつながっていないゲーム・ログインしていない人には何も出さない。
 */
export function PlayEventPoints() {
  const token = gameTokenFromPath(usePathname());
  const [info, setInfo] = useState<PointsInfo | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const load = () =>
      fetch(`/api/play/${encodeURIComponent(token)}/points`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((json: PointsInfo | null) => {
          if (!cancelled && json) setInfo(json);
        })
        .catch(() => {});
    void load();
    const timer = window.setInterval(load, POLL_MS);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [token]);

  if (!token || !info?.linked) return null;
  const balance = info.balance ?? 0;
  const note = info.status === "ended" ? "終了したので使えません" : info.until ? `${info.until}使えます` : "クリアするとたまります";

  return (
    // 押すとポイントの画面（使えるポイント・これまでの記録・バッジ）へ
    <Link
      href="/points"
      className="flex min-w-0 max-w-[60vw] flex-col items-center rounded-full border border-[#ecd9a6] bg-[#fffaf0]/95 px-3 py-1 text-center shadow-[0_2px_8px_rgba(0,0,0,0.08)] active:bg-[#fdf3dc]"
      aria-label={`${info.eventTitle}のポイント ${balance}pt（ポイントの画面へ）`}
    >
      <span className="flex items-baseline gap-1 leading-none">
        <span className="max-w-[9rem] truncate text-[10.5px] font-semibold text-[#8a6a1c]">{info.eventTitle}</span>
        <strong className="text-[15px] font-bold tabular-nums text-[#2f8f57]">{balance.toLocaleString("ja-JP")}</strong>
        <span className="text-[10px] font-semibold text-[#8a6a1c]">pt</span>
      </span>
      <span className="mt-0.5 text-[9.5px] leading-none text-[#9a8a64]">{note}</span>
    </Link>
  );
}
