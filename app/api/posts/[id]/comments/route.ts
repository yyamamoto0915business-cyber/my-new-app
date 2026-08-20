import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import {
  createPostComment,
  listCommentsByPostId,
} from "@/lib/db/community-post-comments";
import { mapDbCommentToView } from "@/lib/posts/map-community-post";
import { getSeedComments } from "@/lib/posts/mock-detail";

const COMMENT_MAX_LENGTH = 500;

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const postId = id.trim();
  if (!postId) {
    return NextResponse.json({ error: "投稿が不正です" }, { status: 400 });
  }

  const rows = await listCommentsByPostId(postId);
  const live = rows.map(mapDbCommentToView);
  const seeds = getSeedComments(postId);

  return NextResponse.json(
    { comments: [...live, ...seeds] },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const postId = id.trim();
  if (!postId) {
    return NextResponse.json({ error: "投稿が不正です" }, { status: 400 });
  }

  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON が不正です" }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const text = String(data.body ?? "").trim();
  if (!text) {
    return NextResponse.json(
      { error: "コメントを入力してください" },
      { status: 400 },
    );
  }

  try {
    const row = await createPostComment({
      postId,
      authorId: user.id,
      authorDisplayName: user.name ?? "ユーザー",
      body: text.slice(0, COMMENT_MAX_LENGTH),
    });
    return NextResponse.json(mapDbCommentToView(row), { status: 201 });
  } catch (e) {
    console.error("comments POST:", e);
    return NextResponse.json(
      { error: "コメントの保存に失敗しました" },
      { status: 500 },
    );
  }
}
