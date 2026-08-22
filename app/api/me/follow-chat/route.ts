import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { createOrGetFollowChat } from "@/lib/db/follow-chat";

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
  const userId = String((body as { userId?: unknown }).userId ?? "").trim();
  if (!userId) {
    return NextResponse.json({ error: "userId が必要です" }, { status: 400 });
  }
  const result = await createOrGetFollowChat(user.id, userId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ conversationId: result.conversationId });
}
