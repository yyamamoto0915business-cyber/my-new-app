import type { Metadata } from "next";
import { PostsHubClient } from "@/components/posts/PostsHubClient";

export const metadata: Metadata = {
  title: "みんなの投稿 | MachiGlyph",
  description:
    "地域のみんなの投稿から、まちの魅力を見つけましょう。イベント・お店・スポットなどの体験を共有できます。",
};

export default function PostsPage() {
  return <PostsHubClient />;
}
