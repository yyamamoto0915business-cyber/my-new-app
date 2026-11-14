import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KINDS = new Set(["event", "store", "recruitment"]);
/** 見るだけのロボット（検索エンジンなど）は数えない */
const BOT_RE = /bot|crawler|spider|crawling|preview|facebookexternalhit|slurp|headless/i;

/**
 * POST { kind, id }：掲載の詳細ページが開かれたことを数える（主催者のダッシュボードの「閲覧数」）。
 * 数えるのはデータベースの関数 record_listing_view（00130、サーバーだけが呼べる）。失敗しても画面には何も出さない。
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { kind?: unknown; id?: unknown } | null;
  const kind = typeof body?.kind === "string" ? body.kind : "";
  const id = typeof body?.id === "string" ? body.id : "";
  if (!KINDS.has(kind) || !UUID_RE.test(id)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (BOT_RE.test(request.headers.get("user-agent") ?? "")) {
    return NextResponse.json({ ok: true, counted: false });
  }
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false }, { status: 503 });
  const { error } = await admin.rpc("record_listing_view", { p_kind: kind, p_target_id: id });
  if (error) {
    // 00130 の適用前は関数がない。数えられなくても困らないので、記録だけ残す
    if (!/record_listing_view|does not exist|Could not find/i.test(error.message ?? "")) {
      console.error("record listing view:", error);
    }
    return NextResponse.json({ ok: false });
  }
  return NextResponse.json({ ok: true, counted: true });
}
