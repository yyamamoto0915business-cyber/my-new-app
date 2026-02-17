import { NextRequest, NextResponse } from "next/server";
import { mockEventRequests } from "@/lib/db/event-requests";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = mockEventRequests.find((r) => r.id === id);
  if (!item) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(item);
}
