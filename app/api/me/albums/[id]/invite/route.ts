import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { inviteToSharedAlbum } from "@/lib/db/shared-albums";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { userId?: string } | null;
  const inviteeId = body?.userId?.trim() ?? "";
  if (!inviteeId) {
    return NextResponse.json({ error: "誘う相手を選んでください" }, { status: 400 });
  }
  const result = await inviteToSharedAlbum(id, user.id, inviteeId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ album: result });
}
