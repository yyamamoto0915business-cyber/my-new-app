import { NextRequest, NextResponse } from "next/server";
import { getArticleById } from "../../../../lib/articles-store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const article = getArticleById(id);
  if (!article) {
    return NextResponse.json({ error: "記事が見つかりません" }, { status: 404 });
  }
  return NextResponse.json(article, {
    headers: { "Cache-Control": "public, s-maxage=60" },
  });
}
