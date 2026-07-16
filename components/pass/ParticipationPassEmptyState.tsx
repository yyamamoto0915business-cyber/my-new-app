"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import type { PassTabId } from "@/lib/participation-pass";
import { ParticipationPassEmptyIllustration } from "@/components/pass/ParticipationPassEmptyIllustration";
import { ParticipationPassBenefits } from "@/components/pass/ParticipationPassBenefits";
import { ParticipationPassSteps } from "@/components/pass/ParticipationPassSteps";
import { cn } from "@/lib/utils";

const EMPTY_MESSAGES: Record<
  PassTabId,
  { title: string; description: string }
> = {
  upcoming: {
    title: "取得済みの参加パスはまだありません",
    description: "イベントに申し込んで参加パスを取得すると、ここに表示されます",
  },
  today: {
    title: "本日開催のイベントはありません",
    description: "今日利用できる参加パスがある場合、ここに表示されます",
  },
  history: {
    title: "参加履歴はまだありません",
    description: "参加したイベントの履歴がここに表示されます",
  },
};

type Props = {
  activeTab: PassTabId;
  /** mobile: メイン＋ステップ / pc: 左カラム用メインカードのみ */
  variant?: "mobile" | "pc";
};

export function ParticipationPassEmptyState({
  activeTab,
  variant = "mobile",
}: Props) {
  const { title, description } = EMPTY_MESSAGES[activeTab];
  const isPc = variant === "pc";

  return (
    <div className={cn(isPc ? "flex h-full min-h-0 flex-col" : "space-y-3")}>
      <article
        aria-label="参加パス空状態"
        className={cn(
          "overflow-hidden border border-[#dce8de] bg-gradient-to-b from-[#f9fcfa] to-white shadow-[0_6px_20px_rgba(40,60,48,0.06)]",
          isPc
            ? "flex h-full min-h-0 flex-col rounded-[22px] px-8 py-8"
            : "rounded-[20px] px-4 py-4"
        )}
      >
        <div className="flex justify-center">
          <ParticipationPassEmptyIllustration
            className={isPc ? "h-[150px] w-[180px]" : "h-[72px] w-[88px]"}
          />
        </div>

        <div className={cn("text-center", isPc ? "mt-2" : "mt-2")}>
          <h2
            className={cn(
              "font-semibold leading-snug text-[#1a2818]",
              isPc ? "text-[16px]" : "text-[14px]"
            )}
          >
            {title}
          </h2>
          <p
            className={cn(
              "leading-relaxed text-[#6a7468]",
              isPc ? "mt-2.5 text-[13px]" : "mt-1 text-[12px]"
            )}
          >
            {description}
          </p>
        </div>

        <div className={cn(isPc ? "mx-auto mt-5 max-w-[320px] space-y-3" : "mt-3 space-y-1.5")}>
          <Link
            href="/events"
            aria-label="イベントを探す"
            className={cn(
              "flex w-full items-center justify-center gap-2 bg-[#4a9a68] font-semibold text-white transition hover:bg-[#3d8560] active:bg-[#357555] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a9a68]/50 focus-visible:ring-offset-2",
              isPc
                ? "h-[52px] rounded-2xl text-[14px]"
                : "h-11 rounded-[14px] text-[13.5px]"
            )}
          >
            <Search className="h-[17px] w-[17px]" aria-hidden />
            イベントを探す
          </Link>

          <Link
            href="/events"
            className={cn(
              "flex items-center justify-center font-medium text-[#2d7a4f] transition hover:text-[#256842] active:text-[#1f5838] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a9a68]/40 focus-visible:ring-offset-2",
              isPc ? "min-h-[44px] text-[13px]" : "min-h-[36px] text-[12.5px]"
            )}
          >
            おすすめイベントを見る →
          </Link>
        </div>

        <div className={isPc ? "mt-7" : "mt-3"}>
          <ParticipationPassBenefits layout={isPc ? "pc" : "mobile"} />
        </div>
      </article>

      {!isPc && <ParticipationPassSteps orientation="mobile" />}
    </div>
  );
}
