"use client";

import { PublishSuccessCard } from "@/components/publish/PublishSuccessCard";
import { hasPublicPublishTargetId } from "@/lib/dev-publish-success-preview";

type Props = {
  postId: string;
  isPreview?: boolean;
};

export function PostPublishSuccess({ postId, isPreview = false }: Props) {
  const hasPublicPage = hasPublicPublishTargetId(postId);

  return (
    <PublishSuccessCard
      description={
        <>
          投稿が公開されました。
          <br />
          まちの魅力が届くのを楽しみにしましょう！
        </>
      }
      primaryHref={hasPublicPage ? `/posts/${postId}` : "/posts"}
      primaryLabel={hasPublicPage ? "投稿を表示" : "みんなの投稿を見る"}
      secondaryHref="/profile/posts"
      secondaryLabel="マイアルバムへ"
      isPreview={isPreview}
    />
  );
}
