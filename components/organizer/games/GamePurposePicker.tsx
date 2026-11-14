"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, HelpCircle, MapPin, Camera, Trophy, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getOrganizerGameType, type OrganizerGameTypeId } from "@/lib/organizer/game-types";

/**
 * ゲームを作るときの最初の画面（画面案 ①「作り方を選ぶ」）。
 * 種類が11個あって迷うので、まず「やりたいこと」を4つから選び、合うひな形（今の種類）だけを出す。
 * 全部の種類は「すべての種類から選ぶ」で今までどおり見られる（OrganizerGamesHub）。
 */
type PurposeId = "walk" | "answer" | "collect" | "decide";

const PURPOSES: {
  id: PurposeId;
  label: string;
  sub: string;
  Icon: LucideIcon;
  color: string;
  bg: string;
  types: OrganizerGameTypeId[];
}[] = [
  {
    id: "walk",
    label: "まちを回ってもらう",
    sub: "スタンプ・チェックイン・クーポン",
    Icon: MapPin,
    color: "#2f7d4e",
    bg: "#e6f3ea",
    types: ["stamp", "checkin", "photo", "coupon", "mission"],
  },
  {
    id: "answer",
    label: "問題に答えてもらう",
    sub: "クイズラリー・謎解き",
    Icon: HelpCircle,
    color: "#a26a10",
    bg: "#fdf3dc",
    types: ["quiz", "mystery"],
  },
  {
    id: "collect",
    label: "集める・聞く",
    sub: "写真・アンケート",
    Icon: Camera,
    color: "#2f6fae",
    bg: "#e6f1fa",
    types: ["photo", "survey"],
  },
  {
    id: "decide",
    label: "みんなで決める",
    sub: "投票・抽選・トーナメント表",
    Icon: Trophy,
    color: "#6a4fb0",
    bg: "#efeaf9",
    types: ["vote", "lottery", "tournament"],
  },
];

/** ひな形の小さな絵（専用の絵がない種類は共通のマスコット） */
const MASCOT: Partial<Record<OrganizerGameTypeId, string>> = {
  stamp: "/organizer/games/hub-mascot-stamp.png",
  quiz: "/organizer/games/hub-mascot-quiz.png",
  mystery: "/organizer/games/hub-mascot-mystery.png",
  mission: "/organizer/games/hub-mascot-mission.png",
  photo: "/organizer/games/hub-mascot-photo.png",
  coupon: "/organizer/games/hub-mascot-coupon.png",
  checkin: "/organizer/games/game-type-checkin.png?v=hub4",
};

export function GamePurposePicker({ className }: { className?: string }) {
  const [purpose, setPurpose] = useState<PurposeId>("walk");
  const current = PURPOSES.find((p) => p.id === purpose) ?? PURPOSES[0];

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <p className="text-[17px] font-bold text-[#163828]">何をしたいですか？</p>
        <p className="text-[12.5px] text-[#5f6d64]">選ぶと、合うひな形が出ます。</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 pc:grid-cols-4" role="radiogroup" aria-label="やりたいこと">
        {PURPOSES.map((p) => {
          const on = p.id === purpose;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setPurpose(p.id)}
              className={cn(
                "flex min-h-[44px] flex-col items-start gap-1.5 rounded-[18px] bg-white p-3.5 text-left",
                on ? "border-2 border-[#2f7d4e] shadow-[0_3px_10px_rgba(22,56,40,0.08)]" : "border-[1.5px] border-[#e3e8e3]"
              )}
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
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <p className="text-[13px] font-bold text-[#3f5146]">「{current.label}」のひな形</p>
        <ul className="space-y-2 pc:grid pc:grid-cols-2 pc:gap-2 pc:space-y-0">
          {current.types.map((id) => {
            const t = getOrganizerGameType(id);
            const mascot = MASCOT[id] ?? "/organizer/games/hub-mascot.png";
            return (
              <li key={id}>
                <Link
                  href={`/organizer/games/new?type=${id}`}
                  className="flex min-h-[60px] items-center gap-3 rounded-[16px] border border-[#e3e8e3] bg-white px-3.5 py-2.5 active:bg-[#fafcf9]"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f3f6f1]" aria-hidden>
                    <Image src={mascot} alt="" width={44} height={44} unoptimized />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14.5px] font-bold text-[#163828]">{t.label}</span>
                    <span className="block text-[11.5px] text-[#5f6d64]">{t.description}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#5f6d64]" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
