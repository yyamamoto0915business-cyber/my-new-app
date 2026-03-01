import { NextRequest, NextResponse } from "next/server";
import {
  getPublishedArticles,
  getArticlesByAuthor,
  createArticle,
} from "@/lib/read-articles-store";
import type { ArticleBlock, ArticleTemplateType } from "@/lib/read-article-types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authorId = searchParams.get("authorId");

  if (authorId) {
    const list = getArticlesByAuthor(authorId);
    return NextResponse.json(list, {
      headers: { "Cache-Control": "private, max-age=0" },
    });
  }

  const list = getPublishedArticles();
  return NextResponse.json(list, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      lead,
      coverImageUrl,
      tags,
      templateType,
      authorId,
      authorName,
      blocks,
      status,
    } = body;

    if (!title?.trim() || !lead?.trim() || !coverImageUrl?.trim()) {
      return NextResponse.json(
        { error: "タイトル・リード・カバー画像は必須です" },
        { status: 400 }
      );
    }
    if (!authorId || !authorName?.trim()) {
      return NextResponse.json(
        { error: "著者情報は必須です" },
        { status: 400 }
      );
    }

    const article = createArticle({
      title: String(title).trim(),
      lead: String(lead).trim().slice(0, 140),
      coverImageUrl: String(coverImageUrl).trim(),
      tags: Array.isArray(tags) ? tags.map(String).slice(0, 10) : [],
      templateType: (templateType as ArticleTemplateType) || "feature",
      authorId: String(authorId),
      authorName: String(authorName).trim(),
      blocks: (Array.isArray(blocks) ? blocks : []) as ArticleBlock[],
      status: status === "published" ? "published" : "draft",
    });

    return NextResponse.json(article, { status: 201 });
  } catch (e) {
    console.error("read-articles POST", e);
    return NextResponse.json(
      { error: "記事の作成に失敗しました" },
      { status: 500 }
    );
  }
}
