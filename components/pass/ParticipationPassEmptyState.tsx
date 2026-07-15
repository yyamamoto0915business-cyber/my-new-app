"use client";

import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import type { PassTabId } from "@/lib/participation-pass";
import { ParticipationPassEmptyIllustration } from "@/components/pass/ParticipationPassEmptyIllustration";
import { ParticipationPassBenefits } from "@/components/pass/ParticipationPassBenefits";
import { ParticipationPassSteps } from "@/components/pass/ParticipationPassSteps";

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
};

export function ParticipationPassEmptyState({ activeTab }: Props) {
  const { title, description } = EMPTY_MESSAGES[activeTab];

  return (
    <div className="space-y-4 pb-2">
      <article
        aria-label="参加パス空状態"
        className="overflow-hidden rounded-[22px] border border-[#dce8de] bg-gradient-to-b from-[#f9fcfa] to-white px-4 py-5 shadow-[0_6px_20px_rgba(40,60,48,0.06)]"
      >
        <div className="flex justify-center">
          <ParticipationPassEmptyIllustration className="h-[132px] w-[132px]" />
        </div>

        <div className="mt-1 text-center">
          <h2 className="text-[15px] font-semibold leading-snug text-[#1a2818]">
            {title}
          </h2>
          <p className="mt-2 text-[12.5px] leading-relaxed text-[#6a7468]">
            {description}
          </p>
        </div>

        <div className="mt-4 space-y-3">
          <Link
            href="/events"
            aria-label="イベントを探す"
            className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[15px] bg-[#4a9a68] text-[14px] font-semibold text-white transition hover:bg-[#3d8560] active:bg-[#357555] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a9a68]/50 focus-visible:ring-offset-2"
          >
            <Search className="h-[18px] w-[18px]" aria-hidden />
            イベントを探す
          </Link>

          <Link
            href="/events"
            className="flex min-h-[44px] items-center justify-center gap-1 text-[13px] font-medium text-[#2d7a4f] transition hover:text-[#256842] active:text-[#1f5838] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a9a68]/40 focus-visible:ring-offset-2"
          >
            おすすめイベントを見る
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-5">
          <ParticipationPassBenefits />
        </div>
      </article>

      <ParticipationPassSteps />
    </div>
  );
}
