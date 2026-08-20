import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostDetailView } from "@/components/posts/PostDetailView";
import { getCommunityPostForPublicPage } from "@/lib/posts/get-post-for-public-page";
import { getApiUser } from "@/lib/api-auth";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getCommunityPostForPublicPage(id);
  if (!post) {
    return { title: "投稿 | MachiGlyph" };
  }
  return {
    title: `${post.title} | MachiGlyph`,
    description: post.body || `${post.areaLabel}の投稿`,
  };
}

export default async function PostDetailPage({ params }: Props) {
  const { id } = await params;
  const [post, user] = await Promise.all([
    getCommunityPostForPublicPage(id),
    getApiUser(),
  ]);
  if (!post) notFound();

  const viewer = user ? { name: user.name ?? "あなた" } : null;

  return <PostDetailView post={post} viewer={viewer} />;
}
