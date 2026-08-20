import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { getOrganizerIdByStoreId } from "@/lib/db/stores";
import {
  deleteStoreMenu,
  fetchStoreMenuById,
  updateStoreMenu,
} from "@/lib/db/store-menu";
import {
  deleteMemoryStoreMenu,
  getMemoryStoreMenuById,
  updateMemoryStoreMenu,
} from "@/lib/stores/memory-menu";
import { getMemoryStoreById } from "@/lib/stores/memory-store";
import {
  isStoreMenuStatus,
  normalizePriceYen,
  type StoreMenuInput,
} from "@/lib/stores/types";

type Params = { params: Promise<{ id: string; menuId: string }> };

function isMemoryStoreId(id: string): boolean {
  return id === "demo" || id.startsWith("demo-") || id.startsWith("store-mem-");
}

function parseMenuBody(body: Record<string, unknown>): StoreMenuInput {
  const input: StoreMenuInput = {};
  if (typeof body.name === "string") input.name = body.name;
  if (body.description === null || typeof body.description === "string") {
    input.description = body.description;
  }
  const price = normalizePriceYen(body.priceYen);
  if (price != null) input.priceYen = price;
  if (body.imageUrl === null || typeof body.imageUrl === "string") {
    input.imageUrl = body.imageUrl;
  }
  if (isStoreMenuStatus(body.status)) input.status = body.status;
  if (typeof body.sortOrder === "number") input.sortOrder = body.sortOrder;
  return input;
}

/** GET: メニュー1件 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id: storeId, menuId } = await params;
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const supabase = await createClient();
  if (supabase && !isMemoryStoreId(storeId)) {
    try {
      const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
      const storeOrganizerId = await getOrganizerIdByStoreId(supabase, storeId);
      if (!organizerId || storeOrganizerId !== organizerId) {
        const mem = getMemoryStoreMenuById(storeId, menuId);
        if (mem) return NextResponse.json(mem);
        return NextResponse.json({ error: "メニューが見つかりません" }, { status: 404 });
      }
      const item = await fetchStoreMenuById(supabase, storeId, menuId);
      if (!item) {
        return NextResponse.json({ error: "メニューが見つかりません" }, { status: 404 });
      }
      return NextResponse.json(item);
    } catch (e) {
      console.error("store menu/[menuId] GET:", e);
      const mem = getMemoryStoreMenuById(storeId, menuId);
      if (mem) return NextResponse.json(mem);
      return NextResponse.json(
        { error: "メニューの取得に失敗しました" },
        { status: 500 },
      );
    }
  }

  const item = getMemoryStoreMenuById(storeId, menuId);
  if (!item) {
    return NextResponse.json({ error: "メニューが見つかりません" }, { status: 404 });
  }
  return NextResponse.json(item);
}

/** PATCH: メニュー更新 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id: storeId, menuId } = await params;
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "リクエストの形式が正しくありません" },
      { status: 400 },
    );
  }

  const patch = parseMenuBody(body);

  const supabase = await createClient();
  if (supabase && !isMemoryStoreId(storeId)) {
    try {
      const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
      const storeOrganizerId = await getOrganizerIdByStoreId(supabase, storeId);
      if (!organizerId || storeOrganizerId !== organizerId) {
        const mem = updateMemoryStoreMenu(storeId, menuId, patch);
        if (mem) return NextResponse.json(mem);
        return NextResponse.json({ error: "メニューが見つかりません" }, { status: 404 });
      }
      const updated = await updateStoreMenu(supabase, storeId, menuId, patch);
      if (!updated) {
        return NextResponse.json({ error: "メニューが見つかりません" }, { status: 404 });
      }
      return NextResponse.json(updated);
    } catch (e) {
      console.error("store menu/[menuId] PATCH:", e);
      const mem = updateMemoryStoreMenu(storeId, menuId, patch);
      if (mem) return NextResponse.json(mem);
      return NextResponse.json(
        { error: "メニューの更新に失敗しました" },
        { status: 500 },
      );
    }
  }

  const updated = updateMemoryStoreMenu(storeId, menuId, patch);
  if (!updated) {
    return NextResponse.json({ error: "メニューが見つかりません" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

/** DELETE: メニュー削除 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id: storeId, menuId } = await params;
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const supabase = await createClient();
  if (supabase && !isMemoryStoreId(storeId)) {
    try {
      const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
      const storeOrganizerId = await getOrganizerIdByStoreId(supabase, storeId);
      if (!organizerId || storeOrganizerId !== organizerId) {
        if (getMemoryStoreById(storeId) && deleteMemoryStoreMenu(storeId, menuId)) {
          return NextResponse.json({ ok: true });
        }
        return NextResponse.json({ error: "メニューが見つかりません" }, { status: 404 });
      }
      const ok = await deleteStoreMenu(supabase, storeId, menuId);
      if (!ok) {
        return NextResponse.json({ error: "メニューが見つかりません" }, { status: 404 });
      }
      return NextResponse.json({ ok: true });
    } catch (e) {
      console.error("store menu/[menuId] DELETE:", e);
      if (deleteMemoryStoreMenu(storeId, menuId)) {
        return NextResponse.json({ ok: true });
      }
      return NextResponse.json(
        { error: "メニューの削除に失敗しました" },
        { status: 500 },
      );
    }
  }

  if (!deleteMemoryStoreMenu(storeId, menuId)) {
    return NextResponse.json({ error: "メニューが見つかりません" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
