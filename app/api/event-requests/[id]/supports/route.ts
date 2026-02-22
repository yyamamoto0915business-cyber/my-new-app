import { NextRequest, NextResponse } from "next/server";

// モック: 支援はポイントで行う。初期はモックレスポンスのみ
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;
  return NextResponse.json([]);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { amount, message } = body;
  if (!amount || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "無効な金額です" }, { status: 400 });
  }
  return NextResponse.json({ success: true, request_id: id, amount, message });
}
