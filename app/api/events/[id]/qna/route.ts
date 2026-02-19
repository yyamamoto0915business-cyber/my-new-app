import { NextResponse } from "next/server";
import {
  getPublicQnAsByEvent,
  getQnAsByEvent,
  addQnA,
  type QnACategory,
} from "@/lib/qna-mock";

type Params = { params: Promise<{ id: string }> };

export async function GET(
  _request: Request,
  { params }: Params
) {
  const { id: eventId } = await params;
  const { searchParams } = new URL(_request.url);
  const publicOnly = searchParams.get("public") === "true";

  const items = publicOnly
    ? getPublicQnAsByEvent(eventId)
    : getQnAsByEvent(eventId);
  return NextResponse.json(items);
}

export async function POST(request: Request, { params }: Params) {
  const { id: eventId } = await params;
  const body = await request.json().catch(() => ({}));
  const question = (body.question as string)?.trim();
  const category = (body.category as QnACategory) ?? "other";
  const visibility = body.visibility === "private" ? "private" : "public";
  const userName = (body.userName as string) ?? null;

  if (!question) {
    return NextResponse.json(
      { error: "質問を入力してください" },
      { status: 400 }
    );
  }

  const item = addQnA(eventId, {
    userName,
    category,
    question,
    visibility,
  });
  return NextResponse.json(item);
}
