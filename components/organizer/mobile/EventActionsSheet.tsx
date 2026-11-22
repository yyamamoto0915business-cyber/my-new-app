"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ChevronRight, Sparkles, Wallet, X } from "lucide-react";
import { PlanBadge } from "@/components/organizer/mobile/plan-badge";
import type { BillingSummary, DashboardEvent } from "@/app/api/organizer/dashboard/route";
import { OrganizerEventCard } from "@/components/organizer/events/OrganizerEventCard";

type Props = {
  event: DashboardEvent;
  billingSummary: BillingSummary | null;
  /** アーカイブを見ているとき（復元・削除を出す） */
  archiveBoxMode: boolean;
  onClose: () => void;
  /** 公開・非公開・復元などのあと、一覧を読み直す */
  onRefresh: () => void;
};

/**
 * 掲載管理（スマホ）で、イベントの行を押したときに下から出る操作のシート。
 * 中身はイベント管理のカード（公開する・スタッフ募集・編集・⋯メニュー、確認の画面）をそのまま使い、
 * イベントポイントとこのイベントのレジへの入口を足す（申込者はカードの中にある）。イベント管理の一覧はスマホでは掲載管理にまとめた。
 *
 * body の直下に出す（z-50）。下のナビ（z-50）より後ろに置かれるので上に出て、
 * あとから開く「⋯」メニュー（z-50 の入れ物）はさらに上に出る。カードの確認の画面はこのシートの重なりの中で出る。
 */
export function EventActionsSheet({ event, billingSummary, archiveBoxMode, onClose, onRefresh }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  // 主催者画面の中身は重なりの順番が区切られている（main が z-[1]）ので、body の直下に出す
  return createPortal(
    <div className="fixed inset-0 z-50 min-[900px]:z-[120]" role="dialog" aria-modal="true" aria-label={`${event.title}の操作`}>
      <button
        type="button"
        aria-label="閉じる"
        onClick={onClose}
        className="absolute inset-0 bg-[#0e2a1d]/35 backdrop-blur-[2px]"
      />
      {/* スマホは下から出るシート、PC・iPad 横は画面の中央に出す */}
      <div className="absolute inset-x-0 bottom-0 mx-auto max-h-[85dvh] w-full max-w-xl overflow-y-auto rounded-t-[24px] bg-[#f7f8f5] px-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))] pt-2 shadow-[0_-12px_32px_rgba(14,42,29,0.18)] min-[900px]:bottom-auto min-[900px]:top-1/2 min-[900px]:max-w-[640px] min-[900px]:-translate-y-1/2 min-[900px]:rounded-[24px] min-[900px]:px-5 min-[900px]:pb-5 min-[900px]:pt-4 min-[900px]:shadow-[0_24px_60px_rgba(14,42,29,0.25)]">
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-[#d6ddd7] min-[900px]:hidden" aria-hidden />
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[12px] font-bold tracking-[0.08em] text-[#a3812f]">イベントの操作</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#5f6d64] active:bg-[#e9eee9]"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {/* イベント管理のカード（スマホの形）。操作と確認の画面はここに入っている */}
        <div className="org-events-mgmt org-events-mgmt--compact">
          <OrganizerEventCard
            event={event}
            billingSummary={billingSummary}
            onRefresh={onRefresh}
            archiveBoxMode={archiveBoxMode}
            onArchived={() => {
              onRefresh();
              onClose();
            }}
          />
        </div>

        {!archiveBoxMode ? (
          <ul className="mt-3 divide-y divide-[#eef1ec] overflow-hidden rounded-[18px] border border-[#ebeee8] bg-white">
            <li>
              <Link
                href={`/organizer/events/${event.id}/points`}
                className="flex min-h-[48px] items-center gap-3 px-3.5 py-2.5"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fbf3e1] text-[#a3812f]" aria-hidden>
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1 text-[13.5px] font-bold text-[#163828]">イベントポイント</span>
                <ChevronRight className="h-4 w-4 text-[#a3ada6]" aria-hidden />
              </Link>
            </li>
            {/* レジ（このイベントの売上として記録する）。当日の前でも、商品の登録や準備ができる */}
            <li>
              <Link
                href={`/organizer/pos?event=${encodeURIComponent(event.id)}`}
                className="flex min-h-[48px] items-center gap-3 px-3.5 py-2.5"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e6f1fa] text-[#2f6fae]" aria-hidden>
                  <Wallet className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1 text-[13.5px] font-bold text-[#163828]">このイベントのレジ</span>
                <PlanBadge feature="pos" />
                <ChevronRight className="h-4 w-4 text-[#a3ada6]" aria-hidden />
              </Link>
            </li>
          </ul>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
