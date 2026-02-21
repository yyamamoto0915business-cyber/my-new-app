import { NextResponse } from "next/server";
import { getAuth } from "@/lib/get-auth";
import {
  getThreadById,
  canAccessThread,
  getMessages,
  addMessage,
  setThreadStatus,
} from "@/lib/dm-mock";

type Params = { params: Promise<{ threadId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await getAuth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { threadId } = await params;
  const thread = getThreadById(threadId);
  if (!thread) {
    return NextResponse.json({ error: "スレッドが見つかりません" }, { status: 404 });
  }
  if (!canAccessThread(thread, session.user.id)) {
    return NextResponse.json({ error: "アクセス権がありません" }, { status: 403 });
  }

  const messages = getMessages(threadId);
  return NextResponse.json({ thread, messages });
}

export async function POST(request: Request, { params }: Params) {
  const session = await getAuth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { threadId } = await params;
  const thread = getThreadById(threadId);
  if (!thread) {
    return NextResponse.json({ error: "スレッドが見つかりません" }, { status: 404 });
  }
  if (!canAccessThread(thread, session.user.id)) {
    return NextResponse.json({ error: "アクセス権がありません" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const bodyText = (body.body ?? body.content ?? "").toString().trim();

  if (body.status !== undefined) {
    const status = body.status === "resolved" ? "resolved" : "open";
    setThreadStatus(threadId, status);
    return NextResponse.json({ status });
  }

  if (!bodyText) {
    return NextResponse.json(
      { error: "メッセージを入力してください" },
      { status: 400 }
    );
  }

  const msg = addMessage(threadId, session.user.id, bodyText);
  if (!msg) {
    return NextResponse.json(
      { error: "送信に失敗しました" },
      { status: 500 }
    );
  }
  return NextResponse.json(msg);
}
