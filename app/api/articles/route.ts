import { NextRequest, NextResponse } from "next/server";
import { getAllArticles, addArticle } from "../../../lib/articles-store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const publishedOnly = searchParams.get("published") !== "false";
  const articles = getAllArticles(publishedOnly);
  return NextResponse.json(articles, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, body: bodyText, excerpt, imageUrl, authorId, authorName, eventId } = body;

    if (!title?.trim() || !bodyText?.trim()) {
      return NextResponse.json(
        { error: "タイトルと本文は必須です" },
        { status: 400 }
      );
    }

    const article = addArticle({
      title: String(title).trim(),
      body: String(bodyText).trim(),
      excerpt: excerpt?.trim() || null,
      imageUrl: imageUrl?.trim() || null,
      authorId: authorId ?? "guest",
      authorName: authorName?.trim() || "ゲスト",
      status: "published",
      eventId: eventId || null,
    });

    return NextResponse.json(article, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "記事の作成に失敗しました" },
      { status: 500 }
    );
  }
}
