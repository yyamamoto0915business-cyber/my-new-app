import { Suspense } from "react";
import type { Metadata } from "next";
import { SavedPageClient } from "@/components/saved/SavedPageClient";

export const metadata: Metadata = {
  title: "お気に入り | MachiGlyph",
  description: "いいねした投稿と、保存したまちの情報を確認できます。",
};

export default function SavedPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white py-8 text-center text-sm text-zinc-500">読み込み中...</div>
      }
    >
      <SavedPageClient />
    </Suspense>
  );
}
