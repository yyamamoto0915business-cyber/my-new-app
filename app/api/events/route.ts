import { NextResponse } from "next/server";
import { mockEvents } from "../../../lib/events-mock";

export async function GET() {
  return NextResponse.json(mockEvents);
}
