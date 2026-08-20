import type { Metadata } from "next";
import { Suspense } from "react";
import { PostCreatePageClient } from "@/components/posts/PostCreatePageClient";

export const metadata: Metadata = {
  title: "投稿を作成 | MachiGlyph",
  description: "まちの魅力をみんなの投稿に共有します。",
};

export default function PostCreatePage() {
  return (
    <div className="posts-board-page">
      <div className="posts-create-page-shell">
        <Suspense fallback={null}>
          <PostCreatePageClient />
        </Suspense>
      </div>
    </div>
  );
}
