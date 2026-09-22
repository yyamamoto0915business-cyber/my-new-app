import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import {
  createSharedAlbum,
  listInviteCandidates,
  listSharedAlbumsForUser,
} from "@/lib/db/shared-albums";

export async function GET(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const url = new URL(request.url);
  const peerId = url.searchParams.get("peerId");
  if (url.searchParams.get("invitees") === "1") {
    const invitees = await listInviteCandidates(user.id);
    return NextResponse.json({ invitees });
  }
  const albums = await listSharedAlbumsForUser(user.id, peerId);
  return NextResponse.json({ albums });
}

export async function POST(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as { title?: string } | null;
  const result = await createSharedAlbum(user.id, body?.title ?? "");
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ album: result });
}
