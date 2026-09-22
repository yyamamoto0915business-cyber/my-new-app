import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { removeSharedAlbumItem } from "@/lib/db/shared-albums";

type Params = { params: Promise<{ id: string; itemId: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const { id, itemId } = await params;
  const result = await removeSharedAlbumItem(id, user.id, itemId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ album: result });
}
