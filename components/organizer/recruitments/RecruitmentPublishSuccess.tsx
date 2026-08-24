"use client";

import { PublishSuccessCard } from "@/components/publish/PublishSuccessCard";
import { hasPublicPublishTargetId } from "@/lib/dev-publish-success-preview";

type Props = {
  recruitmentId: string;
  /** 見た目確認用プレビュー（実データなし） */
  isPreview?: boolean;
};

/** スタッフ募集の公開完了（確認・公開ステップ内の差し替え表示） */
export function RecruitmentPublishSuccess({ recruitmentId, isPreview = false }: Props) {
  const hasPublicPage = hasPublicPublishTargetId(recruitmentId);
  const publicHref = hasPublicPage ? `/volunteer/${recruitmentId}` : "/?kind=volunteer";

  return (
    <PublishSuccessCard
      description={
        <>
          スタッフ募集が公開されました。
          <br />
          たくさんの応募が届くのを楽しみにしましょう！
        </>
      }
      primaryHref={publicHref}
      primaryLabel={hasPublicPage ? "募集ページを表示" : "ボランティア一覧を見る"}
      secondaryHref="/organizer"
      secondaryLabel="ダッシュボードに戻る"
      isPreview={isPreview}
      notice={
        <div className="mt-5 flex items-start gap-3 rounded-[12px] border border-[#d5ebc4] bg-[#F4FAEF] px-3.5 py-3 text-left">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#3d8a24]">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-[#1a2818]">
              応募があったらお知らせします
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-[#5c5a54]">
              新しい応募が入ると、アプリの通知やダッシュボードで確認できます。
            </p>
          </div>
          <div
            className="relative mt-0.5 hidden h-10 w-7 shrink-0 rounded-[6px] border border-[#c8d9bc] bg-white sm:block"
            aria-hidden
          >
            <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#6BBF3E] px-0.5 text-[8px] font-bold text-white">
              1
            </span>
            <span className="absolute inset-x-1 top-2 h-1 rounded-sm bg-[#e8f0e2]" />
            <span className="absolute inset-x-1 top-4 h-1 rounded-sm bg-[#e8f0e2]" />
          </div>
        </div>
      }
    />
  );
}
