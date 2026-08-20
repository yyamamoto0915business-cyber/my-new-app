import type { Metadata } from "next";
import { Suspense } from "react";
import { ApplicationsConfirmPreviewClient } from "./preview-client";

export const metadata: Metadata = {
  title: "応募確認（プレビュー） | MachiGlyph",
  description: "ボランティア応募確認画面のプレビュー（全項目入力済み・ログイン不要）",
};

/**
 * ログイン不要。
 * ?view=mobile でモバイル表示。
 */
export default function ApplicationsConfirmPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-8 text-center text-sm text-[#566358]">読み込み中...</div>
      }
    >
      <ApplicationsConfirmPreviewClient />
    </Suspense>
  );
}
