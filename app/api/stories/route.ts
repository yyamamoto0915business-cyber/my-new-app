import { NextRequest, NextResponse } from "next/server";
import {
  getPublishedStories,
  getStoriesByAuthor,
  getStoriesByEventId,
  createStory,
} from "@/lib/stories-store";
import type { StoryBlock, StoryRole, StoryPurpose } from "@/lib/story-types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authorId = searchParams.get("authorId");
  const eventId = searchParams.get("eventId");
  const role = searchParams.get("role") as StoryRole | null;
  const limit = searchParams.get("limit");

  if (eventId) {
    const list = getStoriesByEventId(eventId, {
      role: role ?? undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return NextResponse.json(list, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  }

  if (authorId) {
    const list = getStoriesByAuthor(authorId);
    return NextResponse.json(list, {
      headers: { "Cache-Control": "private, max-age=0" },
    });
  }

  const list = getPublishedStories(limit ? parseInt(limit, 10) : undefined);
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
      role,
      purpose,
      authorId,
      authorName,
      eventId,
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

    const story = createStory({
      title: String(title).trim(),
      lead: String(lead).trim().slice(0, 140),
      coverImageUrl: String(coverImageUrl).trim(),
      tags: Array.isArray(tags) ? tags.map(String).slice(0, 10) : [],
      role: (role as StoryRole) || "organizer",
      purpose: (purpose as StoryPurpose) || "promotion",
      authorId: String(authorId),
      authorName: String(authorName).trim(),
      eventId: eventId ? String(eventId) : null,
      blocks: (Array.isArray(blocks) ? blocks : []) as StoryBlock[],
      status: status === "published" ? "published" : "draft",
    });

    return NextResponse.json(story, { status: 201 });
  } catch (e) {
    console.error("stories POST", e);
    return NextResponse.json(
      { error: "ストーリーの作成に失敗しました" },
      { status: 500 }
    );
  }
}
