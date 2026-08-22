import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/db/notifications";
import {
  getFollowByPair,
  requestFollow,
  unfollow,
} from "@/lib/db/user-follows";

export async function GET(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const userId = new URL(request.url).searchParams.get("userId") ?? "";
  if (!userId) {
    return NextResponse.json({ error: "userId が必要です" }, { status: 400 });
  }
  if (userId === user.id) {
    return NextResponse.json({ status: "self" });
  }
  const row = await getFollowByPair(user.id, userId);
  return NextResponse.json({ status: row?.status ?? "none", id: row?.id ?? null });
}

export async function POST(request: NextRequest) {
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
  const userId = String((body as Record<string, unknown>).userId ?? "").trim();
  if (!userId) {
    return NextResponse.json({ error: "userId が必要です" }, { status: 400 });
  }

  const before = await getFollowByPair(user.id, userId);
  const result = await requestFollow(user.id, userId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const supabase = await createClient();
  const fromName = user.name ?? "ユーザー";
  if (supabase && result.status === "pending" && before?.status !== "pending") {
    await createNotification(
      supabase,
      userId,
      "follow_request",
      `${fromName}さんからフォロー申請が届きました`,
      {
        body: "承認すると、非公開のアルバムも見られるようになります。",
        link: `/notifications?follow=${result.id}`,
      },
    );
  }
  if (supabase && result.status === "accepted" && before?.status !== "accepted") {
    await createNotification(
      supabase,
      userId,
      "follow_accepted",
      `${fromName}さんにフォローされました`,
      {
        body: "フォロワー一覧から確認できます。",
        link: `/profile/follows?tab=followers`,
      },
    );
  }

  return NextResponse.json({ status: result.status, id: result.id }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const userId = new URL(request.url).searchParams.get("userId") ?? "";
  if (!userId) {
    return NextResponse.json({ error: "userId が必要です" }, { status: 400 });
  }
  await unfollow(user.id, userId);
  return NextResponse.json({ ok: true });
}
