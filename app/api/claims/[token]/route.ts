import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { acceptClaim, readClaim } from "@/lib/organizer/proxy-claims";

type Params = { params: Promise<{ token: string }> };

/** GET：受け取りリンクの中身（だれでも見られる。主催者ページの名前と数だけ） */
export async function GET(_req: Request, { params }: Params) {
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
  const { token } = await params;
  const info = await readClaim(admin, token);
  if (info.state !== "ok") return NextResponse.json({ state: info.state });
  return NextResponse.json({
    state: "ok",
    organizerName: info.organizerName,
    stores: info.stores,
    events: info.events,
    expiresAt: info.expiresAt,
  });
}

/** POST { agree: true }：受け取る（ログインが必要・利用規約への同意が必要） */
export async function POST(req: Request, { params }: Params) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { agree?: unknown } | null;
  if (body?.agree !== true) return NextResponse.json({ error: "利用規約への同意が必要です" }, { status: 400 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
  const { token } = await params;
  const result = await acceptClaim(admin, token, user.id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
