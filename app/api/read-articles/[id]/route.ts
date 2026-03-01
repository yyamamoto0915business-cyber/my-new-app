import { NextRequest, NextResponse } from "next/server";
import {
  getArticleById,
  updateArticle,
  publishArticle,
} from "@/lib/read-articles-store";
import type { ArticleBlock } from "@/lib/read-article-types";

type Params = Promise<{ id: string }>;

export async function GET(
  _request: NextRequest,
  { params }: { params: Params }
) {
  const { id } = await params;
  const article = getArticleById(id);
  if (!article) {
    return NextResponse.json({ error: "記事が見つかりません" }, { status: 404 });
  }
  return NextResponse.json(article);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  const { id } = await params;
  const article = getArticleById(id);
  if (!article) {
    return NextResponse.json({ error: "記事が見つかりません" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { action, title, lead, coverImageUrl, tags, blocks, status } = body;

    if (action === "publish") {
      const updated = publishArticle(id);
      return NextResponse.json(updated);
    }

    const updates: Parameters<typeof updateArticle>[1] = {};
    if (title !== undefined) updates.title = String(title).trim();
    if (lead !== undefined) updates.lead = String(lead).trim().slice(0, 140);
    if (coverImageUrl !== undefined) updates.coverImageUrl = String(coverImageUrl).trim();
    if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags.map(String).slice(0, 10) : [];
    if (blocks !== undefined) updates.blocks = blocks as ArticleBlock[];
    if (status !== undefined) updates.status = status === "published" ? "published" : "draft";

    const updated = updateArticle(id, updates);
    return NextResponse.json(updated);
  } catch (e) {
    console.error("read-articles PATCH", e);
    return NextResponse.json(
      { error: "更新に失敗しました" },
      { status: 500 }
    );
  }
}
