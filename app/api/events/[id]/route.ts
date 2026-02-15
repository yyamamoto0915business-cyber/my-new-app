import { NextResponse } from "next/server";
import { getEventById } from "../../../../lib/events";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const event = getEventById(id);
  if (!event) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(event);
}
