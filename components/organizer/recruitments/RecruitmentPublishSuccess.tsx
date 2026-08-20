"use client";

import Link from "next/link";

type Props = {
  recruitmentId: string;
  /** 見た目確認用プレビュー（実データなし） */
  isPreview?: boolean;
};

/** スタッフ募集の公開完了（確認・公開ステップ内の差し替え表示） */
export function RecruitmentPublishSuccess({ recruitmentId, isPreview = false }: Props) {
  const hasPublicPage =
    recruitmentId.length > 0 && recruitmentId !== "preview";
  const publicHref = hasPublicPage ? `/volunteer/${recruitmentId}` : "/?kind=volunteer";

  return (
    <div className="mx-auto w-full max-w-md px-1 py-2 min-[900px]:py-6">
      <div className="rounded-[16px] border border-[#e8e6e0] bg-white px-5 py-8 text-center shadow-[0_1px_0_rgba(15,23,42,0.04)] min-[900px]:px-8 min-[900px]:py-10">
        <div className="relative mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center">
          <span
            aria-hidden
            className="absolute -left-3 top-1 h-2 w-2 rotate-45 bg-[#E8708A]"
          />
          <span
            aria-hidden
            className="absolute -right-2 top-0 h-2 w-2 rotate-45 bg-[#F0A020]"
          />
          <span
            aria-hidden
            className="absolute -left-1 bottom-1 h-1.5 w-1.5 rotate-45 bg-[#5B9BD5]"
          />
          <span
            aria-hidden
            className="absolute -right-3 bottom-2 h-2 w-2 rotate-45 bg-[#6BBF3E]"
          />
          <span
            aria-hidden
            className="absolute left-8 -top-2 h-1.5 w-1.5 rotate-45 bg-[#6BBF3E]/70"
          />
          <div className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#E8F6DE]">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3d8a24"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        <h2 className="text-[20px] font-bold leading-snug text-[#3d8a24] min-[900px]:text-[22px]">
          公開が完了しました！
        </h2>
        <p className="mt-3 text-[13px] leading-relaxed text-[#1a1a1a]">
          スタッフ募集が公開されました。
          <br />
          たくさんの応募が届くのを楽しみにしましょう！
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <Link
            href={publicHref}
            className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-[#6BBF3E] bg-white px-4 py-3 text-[13px] font-semibold text-[#3d8a24] transition hover:bg-[#F4FAEF]"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            {hasPublicPage ? "募集ページを表示" : "ボランティア一覧を見る"}
          </Link>
          <Link
            href="/organizer"
            className="inline-flex items-center justify-center rounded-[10px] bg-[#3d8a24] px-4 py-3 text-[13px] font-semibold text-white transition hover:bg-[#34741e]"
          >
            ダッシュボードに戻る
          </Link>
        </div>

        {isPreview ? (
          <p className="mt-3 text-[11px] leading-relaxed text-[#888]">
            ※ 見た目プレビューです。実際の公開後は、作成した募集ページへ移動します。
          </p>
        ) : null}

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
      </div>
    </div>
  );
}
