import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostDetailView } from "@/components/posts/PostDetailView";
import { PrivatePostBlocked } from "@/components/posts/PrivatePostBlocked";
import { getCommunityPostAccess } from "@/lib/db/community-posts";
import { getApiUser } from "@/lib/api-auth";
import { listLikedPostIds } from "@/lib/db/community-post-likes";
import { applyLikedByMe, mapDbCommunityPostToView } from "@/lib/posts/map-community-post";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const user = await getApiUser();
  const access = await getCommunityPostAccess(id, user?.id ?? null);
  if (access.kind === "ok") {
    return {
      title: `${access.post.title} | MachiGlyph`,
      description: access.post.body || `${access.post.area_label}の投稿`,
    };
  }
  if (access.kind === "private") {
    return { title: "非公開の投稿 | MachiGlyph" };
  }
  return { title: "投稿 | MachiGlyph" };
}

export default async function PostDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await getApiUser();
  const access = await getCommunityPostAccess(id, user?.id ?? null);

  if (access.kind === "missing") notFound();
  if (access.kind === "private") {
    return <PrivatePostBlocked authorId={access.authorId} />;
  }

  let post = mapDbCommunityPostToView(access.post);
  if (user) {
    const likedIds = await listLikedPostIds(user.id, [post.id]);
    post = applyLikedByMe([post], likedIds)[0] ?? post;
  }
  const viewer = user ? { name: user.name ?? "あなた", id: user.id } : null;

  return <PostDetailView post={post} viewer={viewer} />;
}
