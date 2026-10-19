"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Gift, Stamp, X } from "lucide-react";
import {
  PLAY_SESSION_CHANGE_EVENT,
  dismissPlaySession,
  readActivePlaySession,
  type ActivePlaySession,
} from "@/lib/organizer/play-session";
import { organizerGameJoinPath } from "@/lib/organizer/game-tokens";
import { cn } from "@/lib/utils";

/** この端末でいちばん最近遊んだゲーム。参加情報が変わるたびに読み直す。 */
export function useActivePlaySession(includeDismissed = false): ActivePlaySession | null {
  const pathname = usePathname();
  const [session, setSession] = useState<ActivePlaySession | null>(null);
  useEffect(() => {
    const read = () => setSession(readActivePlaySession({ includeDismissed }));
    read();
    window.addEventListener(PLAY_SESSION_CHANGE_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(PLAY_SESSION_CHANGE_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, [pathname, includeDismissed]);
  return session;
}

function progressLabel(session: ActivePlaySession): string | null {
  if (session.completed) return "コンプリート！";
  if (typeof session.stampedCount !== "number" || typeof session.spotCount !== "number" || session.spotCount <= 0) {
    return null;
  }
  return `${session.stampedCount} / ${session.spotCount}`;
}

/** 通常画面の下ナビの上に出す「ゲームに戻る」。 */
export function PlayResumeBar() {
  const pathname = usePathname() ?? "";
  const active = useActivePlaySession();
  // チェックイン画面には同じ内容のカードがあるので、バーは出さない。
  const session = pathname.startsWith("/checkin") ? null : active;
  const shown = Boolean(session);
  // バーの高さぶん、ページ下の余白を広げる（globals.css の html[data-play-bar]）。
  useEffect(() => {
    if (!shown) return;
    document.documentElement.dataset.playBar = "1";
    return () => {
      delete document.documentElement.dataset.playBar;
    };
  }, [shown]);
  if (!session) return null;
  const label = progressLabel(session);
  return (
    <div className="flex items-center gap-1 border-b border-[#dde9e1] bg-[#1f7a4a] px-2 py-1.5 text-white">
      <Link
        href={organizerGameJoinPath(session.joinToken)}
        className="flex min-h-[40px] min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2"
      >
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-white/15">
          {session.completed ? <Gift className="h-4 w-4" aria-hidden /> : <Stamp className="h-4 w-4" aria-hidden />}
        </span>
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="text-[10px] font-semibold text-white/75">プレイ中のゲーム</span>
          <span className="truncate text-[13px] font-bold">
            {session.title}
            {label && !session.completed ? <span className="ml-2 font-extrabold text-[#ffe08a]">{label}</span> : null}
          </span>
        </span>
        <span className="flex flex-none items-center gap-0.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-[#1f7a4a]">
          {session.completed ? "特典を見る" : "ゲームに戻る"}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      </Link>
      <button
        type="button"
        onClick={() => dismissPlaySession(session.joinToken)}
        className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-white/80"
        aria-label="ゲームに戻るを閉じる"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

/** チェックイン画面に出す、プレイ中のゲームのカード。下ナビのバーを閉じていても出す。 */
export function PlayResumeCard({ tone = "light", className }: { tone?: "light" | "dark"; className?: string }) {
  const session = useActivePlaySession(true);
  if (!session) return null;
  const label = progressLabel(session);
  const dark = tone === "dark";
  return (
    <Link
      href={organizerGameJoinPath(session.joinToken)}
      className={cn(
        "flex min-h-[56px] items-center gap-3 rounded-2xl px-4 py-3",
        dark ? "border border-white/20 bg-white/10 text-white" : "border border-[#d5e7dc] bg-white text-[#1d2a22] shadow-sm",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 flex-none items-center justify-center rounded-full",
          dark ? "bg-white/15" : "bg-[#e7f4ec] text-[#1f7a4a]",
        )}
      >
        {session.completed ? <Gift className="h-5 w-5" aria-hidden /> : <Stamp className="h-5 w-5" aria-hidden />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className={cn("text-[11px] font-semibold", dark ? "text-white/70" : "text-[#66726a]")}>
          プレイ中のゲーム
        </span>
        <span className="truncate text-[14px] font-bold">{session.title}</span>
        {label ? (
          <span className={cn("text-[12px] font-bold", dark ? "text-[#ffe08a]" : "text-[#1f7a4a]")}>{label}</span>
        ) : null}
      </span>
      <span
        className={cn(
          "flex flex-none items-center gap-0.5 text-[12px] font-bold",
          dark ? "text-white" : "text-[#1f7a4a]",
        )}
      >
        {session.completed ? "特典を見る" : "ゲームに戻る"}
        <ChevronRight className="h-4 w-4" aria-hidden />
      </span>
    </Link>
  );
}
