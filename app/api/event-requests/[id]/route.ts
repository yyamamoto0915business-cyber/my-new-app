import { NextRequest, NextResponse } from "next/server";
import { mockEventRequests } from "@/lib/db/event-requests";

const EVENT_REQUESTS_DISABLED = true;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 「イベントのお願い」はいったん公開を止めている（app/event-requests/layout.tsx）
  if (EVENT_REQUESTS_DISABLED) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { id } = await params;
  const item = mockEventRequests.find((r) => r.id === id);
  if (!item) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(item);
}
