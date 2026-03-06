import { NextResponse } from "next/server";
import { getEventForPublicPage } from "@/lib/get-event-for-page";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const event = await getEventForPublicPage(id);
  if (!event) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(event);
}
