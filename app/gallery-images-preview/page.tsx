import type { Metadata } from "next";
import { Suspense } from "react";
import { GalleryImagesPreviewClient } from "./preview-client";

export const metadata: Metadata = {
  title: "複数画像（プレビュー） | MachiGlyph",
  description: "イベント・ボランティアの複数画像対応プレビュー（ログイン不要）",
};

/**
 * ログイン不要。
 * ?view=mobile でモバイル幅表示。
 */
export default function GalleryImagesPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-8 text-center text-sm text-[#566358]">読み込み中...</div>
      }
    >
      <GalleryImagesPreviewClient />
    </Suspense>
  );
}
