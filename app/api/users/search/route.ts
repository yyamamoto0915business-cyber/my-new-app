import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { searchUsersByName } from "@/lib/db/user-search";

export async function GET(request: NextRequest) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  const viewer = await getApiUser();
  const users = await searchUsersByName(query, viewer?.id ?? null);
  return NextResponse.json(
    { users },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
