"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";

/** 下書きを開き直すとき、保存した内容を読みこむあいだ（または読みこめなかったとき）に出す。 */
export function GameDraftLoading({ error }: { error: string | null }) {
  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl border border-[#d5e2d8] bg-white px-5 py-10 text-center text-[14px] text-[#566358]">
      {error ? (
        <>
          <p className="font-semibold text-[#b42318]">{error}</p>
          <Link href="/organizer/games" className="mt-3 inline-block font-semibold text-[#2D7A4F] hover:underline">
            ゲーム機能に戻る
          </Link>
        </>
      ) : (
        <p className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          保存した内容を読みこんでいます…
        </p>
      )}
    </div>
  );
}
