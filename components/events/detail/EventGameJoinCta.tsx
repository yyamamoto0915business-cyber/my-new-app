"use client";

import Link from "next/link";
import { ArrowRight, Gamepad2 } from "lucide-react";
import { gameStartHref, useEventPassGames } from "@/components/pass/PassGamesSection";

/**
 * イベント詳細：申し込み済みの人にだけ出す「ゲームに参加する」。
 * ゲームが1つならそのまま始め、2つ以上なら下のゲーム欄へ移る。申し込んでいない人には何も出さない。
 */
export function EventGameJoinCta({ eventId, className = "" }: { eventId: string; className?: string }) {
  const games = useEventPassGames(eventId);
  if (games.length === 0) return null;
  const single = games.length === 1 ? games[0] : null;
  const inner = (
    <>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f6ebc8] text-[#173f2c]">
        <Gamepad2 className="h-4.5 w-4.5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-[11px] font-semibold text-[#d9bc6e]">申し込み済み</span>
        <span className="block truncate text-[14px] font-bold text-white">
          {single ? `「${single.name}」に参加する` : "ゲームに参加する"}
        </span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-[#f6ebc8]" aria-hidden />
    </>
  );
  const cls = `flex w-full items-center gap-3 rounded-2xl border border-[#c9a54e] bg-gradient-to-b from-[#245a3e] to-[#173f2c] px-3.5 py-3 shadow-[0_4px_12px_rgba(14,42,29,0.2)] transition hover:opacity-95 ${className}`;
  return single ? (
    <Link href={gameStartHref(single)} className={cls}>
      {inner}
    </Link>
  ) : (
    <button
      type="button"
      onClick={() => document.getElementById("event-games")?.scrollIntoView({ behavior: "smooth", block: "start" })}
      className={cls}
    >
      {inner}
    </button>
  );
}
