"use client";

import Link from "next/link";
import { ChevronRight, LayoutGrid } from "lucide-react";
import { GAME_PURPOSES } from "@/components/organizer/games/game-purposes";
import { cn } from "@/lib/utils";

/**
 * ゲームを作るときの最初の画面（画面案 ①「作り方を選ぶ」）。
 * 種類が11個あって迷うので、まず「やりたいこと」を4つから選び、合うひな形（今の種類）だけを出す。
 * 全部の種類は「すべての種類から選ぶ」で今までどおり見られる（OrganizerGamesHub）。
 */
export function GamePurposePicker({ className }: { className?: string }) {

  return (
    <div className={cn("space-y-3", className)}>
      {/* テンプレートを使わずに作る入口（いちばん上に。前は一番下にあって見つけにくかった） */}
      <Link
        href="/organizer/games/new?type=mission"
        className="flex min-h-[64px] items-center gap-3 rounded-[18px] border-[1.5px] border-[#d9bc6e] bg-gradient-to-br from-[#245a3e] to-[#173f2c] px-4 py-3 text-[#f6ebc8] shadow-[0_4px_12px_rgba(14,42,29,0.18)] active:scale-[0.98]"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#f6ebc8] text-[#173f2c]" aria-hidden>
          <LayoutGrid className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold text-white">自由に組み合わせて作る</span>
          <span className="mt-0.5 block text-[11.5px] text-[#dfe8e1]">行く・答える・集める・ごほうびを自由に組み合わせる</span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-[#e6d29b]" aria-hidden />
      </Link>

      <div>
        <p className="text-[17px] font-bold text-[#163828]">やりたいことから作る</p>
        <p className="text-[12.5px] text-[#5f6d64]">やりたいことを押すと、すぐ作りはじめられます。遊び方（スタンプ・チェックインなど）と見本は、作りながら選べます。</p>
      </div>

      {/* カードを押すと、そのまま作成に入る。遊び方（スタンプ・チェックインなど）は基本の手順で選ぶ */}
      <div className="grid grid-cols-2 gap-2.5 pc:grid-cols-4">
        {GAME_PURPOSES.map((p) => (
          <Link
            key={p.id}
            href={`/organizer/games/new?type=${p.types[0]}&purpose=${p.id}`}
            className="flex min-h-[44px] flex-col items-start gap-1.5 rounded-[18px] border-[1.5px] border-[#e3e8e3] bg-white p-3.5 text-left transition hover:border-[#2f7d4e] active:scale-[0.98]"
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: p.bg, color: p.color }}
              aria-hidden
            >
              <p.Icon className="h-5 w-5" />
            </span>
            <span className="text-[14.5px] font-bold leading-snug text-[#163828]">{p.label}</span>
            <span className="text-[11.5px] leading-snug text-[#5f6d64]">{p.sub}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
