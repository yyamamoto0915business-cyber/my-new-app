import { NextResponse } from "next/server";
import { getCommunityPostForPublicPage } from "@/lib/posts/get-post-for-public-page";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const post = await getCommunityPostForPublicPage(id);
  if (!post) {
    return NextResponse.json({ error: "投稿が見つかりません" }, { status: 404 });
  }
  return NextResponse.json(post, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
