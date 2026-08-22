import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { listVisibleLikedCommunityPosts } from "@/lib/db/community-post-likes";
import { mapDbCommunityPostToView } from "@/lib/posts/map-community-post";

export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const rows = await listVisibleLikedCommunityPosts(user.id);
  const posts = rows.map((row) => ({
    ...mapDbCommunityPostToView(row),
    likedByMe: true,
  }));

  return NextResponse.json(
    { posts },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
