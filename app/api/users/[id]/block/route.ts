import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { blockUser, isBlockedByMe, unblockUser } from "@/lib/db/moderation";

type Params = { params: Promise<{ id: string }> };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const NO_STORE = { "Cache-Control": "private, no-store" };

async function resolve(params: Params["params"]) {
  const { id } = await params;
  const user = await getApiUser();
  if (!user) {
    return {
      error: NextResponse.json({ error: "ログインが必要です" }, { status: 401 }),
    } as const;
  }
  if (!UUID_RE.test(id) || id === user.id) {
    return {
      error: NextResponse.json({ error: "このユーザーはブロックできません" }, { status: 400 }),
    } as const;
  }
  return { userId: user.id, targetId: id } as const;
}

/** GET: 自分がこの人をブロックしているか */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const user = await getApiUser();
  if (!user || !UUID_RE.test(id)) {
    return NextResponse.json({ blocked: false }, { headers: NO_STORE });
  }
  return NextResponse.json(
    { blocked: await isBlockedByMe(user.id, id) },
    { headers: NO_STORE },
  );
}

/** POST: ブロックする */
export async function POST(_request: Request, { params }: Params) {
  const r = await resolve(params);
  if ("error" in r) return r.error;
  try {
    await blockUser(r.userId, r.targetId);
    return NextResponse.json({ blocked: true });
  } catch (e) {
    console.error("block POST:", e);
    return NextResponse.json({ error: "ブロックできませんでした" }, { status: 500 });
  }
}

/** DELETE: ブロックを解除する */
export async function DELETE(_request: Request, { params }: Params) {
  const r = await resolve(params);
  if ("error" in r) return r.error;
  try {
    await unblockUser(r.userId, r.targetId);
    return NextResponse.json({ blocked: false });
  } catch (e) {
    console.error("block DELETE:", e);
    return NextResponse.json({ error: "ブロックを解除できませんでした" }, { status: 500 });
  }
}
