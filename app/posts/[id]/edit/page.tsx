import type { Metadata } from "next";
import { Suspense } from "react";
import { PostCreatePageClient } from "@/components/posts/PostCreatePageClient";

export const metadata: Metadata = {
  title: "投稿を編集 | MachiGlyph",
  description: "あなたの投稿を編集します。",
};

export default async function PostEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="posts-board-page">
      <div className="posts-create-page-shell">
        <Suspense fallback={null}>
          <PostCreatePageClient postId={id} />
        </Suspense>
      </div>
    </div>
  );
}
