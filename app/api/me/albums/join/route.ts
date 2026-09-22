import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { joinSharedAlbumByToken } from "@/lib/db/shared-albums";

export async function POST(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as { token?: string } | null;
  const result = await joinSharedAlbumByToken(user.id, body?.token ?? "");
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ album: result });
}
