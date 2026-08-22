"use client";

import Link from "next/link";
import { AuthorFollowButton } from "@/components/posts/AuthorFollowButton";

export function PrivatePostBlocked({
  authorId,
}: {
  authorId: string | null;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="text-[13px] font-semibold tracking-[0.16em] text-[#6a8a72]">
        PRIVATE
      </p>
      <h1
        className="mt-2 text-[22px] font-bold text-[#1a2818]"
        style={{ fontFamily: "'Noto Serif JP', serif" }}
      >
        この投稿は非公開になっています
      </h1>
      <p className="mt-3 text-[13px] leading-relaxed text-[#5c5a56]">
        フォローが承認されると、この人の非公開アルバムも見られるようになります。
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {authorId ? <AuthorFollowButton authorId={authorId} /> : null}
        {authorId ? (
          <Link
            href={`/users/${authorId}/album`}
            className="inline-flex items-center rounded-full border border-[#d8cdb8] bg-white px-4 py-2 text-[13px] font-semibold text-[#3a4638]"
          >
            アルバムを見る
          </Link>
        ) : (
          <Link
            href="/posts"
            className="inline-flex items-center rounded-full border border-[#d8cdb8] bg-white px-4 py-2 text-[13px] font-semibold text-[#3a4638]"
          >
            みんなの投稿へ
          </Link>
        )}
      </div>
    </div>
  );
}
