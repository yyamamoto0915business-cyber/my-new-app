import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { createPosProduct, listPosProducts } from "@/lib/db/pos";
import type { PosCategoryId } from "@/lib/pos/types";

const CATEGORIES = new Set(["food", "drink", "ticket", "goods", "other"]);

/** GET: レジ商品一覧 */
export async function GET(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
  }

  const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
  if (!organizerId) {
    return NextResponse.json({ error: "主催者登録が必要です" }, { status: 403 });
  }

  const eventId = request.nextUrl.searchParams.get("eventId");
  const includeInactive = request.nextUrl.searchParams.get("all") === "1";

  try {
    const products = await listPosProducts(supabase, organizerId, {
      eventId: eventId || null,
      activeOnly: !includeInactive,
    });
    return NextResponse.json({ products });
  } catch (e) {
    console.error("pos products GET:", e);
    return NextResponse.json({ error: "商品の取得に失敗しました" }, { status: 500 });
  }
}

/** POST: レジ商品を登録 */
export async function POST(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "データベースに接続できません" }, { status: 503 });
  }

  const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
  if (!organizerId) {
    return NextResponse.json({ error: "主催者登録が必要です" }, { status: 403 });
  }

  let body: {
    name?: string;
    priceYen?: number;
    category?: string;
    imageUrl?: string | null;
    eventId?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  if (!name) {
    return NextResponse.json({ error: "商品名は必須です" }, { status: 400 });
  }
  const priceYen = Number(body.priceYen);
  if (!Number.isFinite(priceYen) || priceYen < 0) {
    return NextResponse.json({ error: "価格が不正です" }, { status: 400 });
  }
  const category = (body.category ?? "other") as PosCategoryId;
  if (!CATEGORIES.has(category)) {
    return NextResponse.json({ error: "カテゴリが不正です" }, { status: 400 });
  }

  try {
    const product = await createPosProduct(supabase, organizerId, {
      name,
      priceYen,
      category,
      imageUrl: body.imageUrl ?? null,
      eventId: body.eventId ?? null,
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (e) {
    console.error("pos products POST:", e);
    return NextResponse.json({ error: "商品の登録に失敗しました" }, { status: 500 });
  }
}
