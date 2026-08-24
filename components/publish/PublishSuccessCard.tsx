"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  description: ReactNode;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  isPreview?: boolean;
  notice?: ReactNode;
};

/** 公開完了の共通カード（募集・イベント・投稿） */
export function PublishSuccessCard({
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  isPreview = false,
  notice,
}: Props) {
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
          {description}
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <Link
            href={primaryHref}
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
            {primaryLabel}
          </Link>
          <Link
            href={secondaryHref}
            className="inline-flex items-center justify-center rounded-[10px] bg-[#3d8a24] px-4 py-3 text-[13px] font-semibold text-white transition hover:bg-[#34741e]"
          >
            {secondaryLabel}
          </Link>
        </div>

        {isPreview ? (
          <p className="mt-3 text-[11px] leading-relaxed text-[#888]">
            ※ 見た目プレビューです。実際の公開後は、作成した公開ページへ移動します。
          </p>
        ) : null}

        {notice}
      </div>
    </div>
  );
}
