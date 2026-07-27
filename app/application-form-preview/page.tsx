import type { Metadata } from "next";
import { Suspense } from "react";
import { ApplicationFormPreviewClient } from "./preview-client";

export const metadata: Metadata = {
  title: "スタッフ応募フォーム（プレビュー） | MachiGlyph",
  description: "ボランティア募集の応募フォームPC / モバイル画面プレビュー（ログイン不要）",
};

/**
 * ログイン不要。
 * ?view=mobile でモバイル表示。
 */
export default function ApplicationFormPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-8 text-center text-sm text-[#566358]">読み込み中...</div>
      }
    >
      <ApplicationFormPreviewClient />
    </Suspense>
  );
}
