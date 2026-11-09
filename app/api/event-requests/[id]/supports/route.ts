import { NextRequest, NextResponse } from "next/server";

// モック: 支援はポイントで行う。初期はモックレスポンスのみ
const EVENT_REQUESTS_DISABLED = true;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 「イベントのお願い」はいったん公開を止めている（app/event-requests/layout.tsx）
  if (EVENT_REQUESTS_DISABLED) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await params;
  return NextResponse.json([]);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 「イベントのお願い」はいったん公開を止めている（app/event-requests/layout.tsx）
  if (EVENT_REQUESTS_DISABLED) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { id } = await params;
  const body = await request.json();
  const { amount, message } = body;
  if (!amount || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "無効な金額です" }, { status: 400 });
  }
  return NextResponse.json({ success: true, request_id: id, amount, message });
}
