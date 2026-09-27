import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import {
  deleteSharedAlbum,
  getSharedAlbumDetail,
  updateSharedAlbumMeta,
} from "@/lib/db/shared-albums";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const { id } = await params;
  const result = await getSharedAlbumDetail(id, user.id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ album: result });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const { id } = await params;
  let body: { title?: unknown; blurb?: unknown; lead?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "入力が正しくありません" }, { status: 400 });
  }
  const result = await updateSharedAlbumMeta(id, user.id, body);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ album: result });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }
  const { id } = await params;
  const result = await deleteSharedAlbum(id, user.id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true });
}
