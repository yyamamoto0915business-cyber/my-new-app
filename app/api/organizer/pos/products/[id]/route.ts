import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { deletePosProduct, updatePosProduct } from "@/lib/db/pos";
import type { PosCategoryId } from "@/lib/pos/types";

type Params = { params: Promise<{ id: string }> };

const CATEGORIES = new Set(["food", "drink", "ticket", "goods", "other"]);

/** PATCH: レジ商品を更新 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
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
    isActive?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.category != null && !CATEGORIES.has(body.category)) {
    return NextResponse.json({ error: "カテゴリが不正です" }, { status: 400 });
  }
  if (body.priceYen != null && (!Number.isFinite(body.priceYen) || body.priceYen < 0)) {
    return NextResponse.json({ error: "価格が不正です" }, { status: 400 });
  }

  try {
    const product = await updatePosProduct(supabase, organizerId, id, {
      name: body.name,
      priceYen: body.priceYen,
      category: body.category as PosCategoryId | undefined,
      imageUrl: body.imageUrl,
      eventId: body.eventId,
      isActive: body.isActive,
    });
    if (!product) {
      return NextResponse.json({ error: "商品が見つかりません" }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch (e) {
    console.error("pos products PATCH:", e);
    return NextResponse.json({ error: "商品の更新に失敗しました" }, { status: 500 });
  }
}

/** DELETE: レジ商品を削除（論理削除） */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
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

  try {
    const ok = await deletePosProduct(supabase, organizerId, id);
    if (!ok) {
      return NextResponse.json({ error: "商品が見つかりません" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("pos products DELETE:", e);
    return NextResponse.json({ error: "商品の削除に失敗しました" }, { status: 500 });
  }
}
