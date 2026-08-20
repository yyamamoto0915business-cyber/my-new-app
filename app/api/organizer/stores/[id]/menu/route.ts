import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { getOrganizerIdByStoreId } from "@/lib/db/stores";
import { createStoreMenu, listStoreMenuByStoreId } from "@/lib/db/store-menu";
import {
  createMemoryStoreMenu,
  listMemoryStoreMenu,
} from "@/lib/stores/memory-menu";
import { getMemoryStoreById } from "@/lib/stores/memory-store";
import {
  isStoreMenuStatus,
  normalizePriceYen,
  type StoreMenuInput,
} from "@/lib/stores/types";

type Params = { params: Promise<{ id: string }> };

function isMemoryStoreId(id: string): boolean {
  return id === "demo" || id.startsWith("demo-") || id.startsWith("store-mem-");
}

function parseMenuBody(body: Record<string, unknown>): StoreMenuInput & {
  name?: string;
  priceYen?: number;
} {
  const input: StoreMenuInput & { name?: string; priceYen?: number } = {};
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

/** GET: メニュー一覧 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id: storeId } = await params;
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
        if (getMemoryStoreById(storeId)) {
          return NextResponse.json({ menu: listMemoryStoreMenu(storeId) });
        }
        return NextResponse.json({ error: "店舗が見つかりません" }, { status: 404 });
      }
      const menu = await listStoreMenuByStoreId(supabase, storeId);
      return NextResponse.json({ menu });
    } catch (e) {
      console.error("store menu GET:", e);
      if (getMemoryStoreById(storeId)) {
        return NextResponse.json({ menu: listMemoryStoreMenu(storeId) });
      }
      return NextResponse.json(
        { error: "メニューの取得に失敗しました" },
        { status: 500 },
      );
    }
  }

  if (!getMemoryStoreById(storeId) && !isMemoryStoreId(storeId)) {
    return NextResponse.json({ error: "店舗が見つかりません" }, { status: 404 });
  }
  return NextResponse.json({ menu: listMemoryStoreMenu(storeId) });
}

/** POST: メニュー作成 */
export async function POST(request: NextRequest, { params }: Params) {
  const { id: storeId } = await params;
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

  const input = parseMenuBody(body);
  const name = input.name?.trim() ?? "";
  if (!name) {
    return NextResponse.json({ error: "商品名は必須です" }, { status: 400 });
  }
  const priceYen = input.priceYen;
  if (priceYen == null) {
    return NextResponse.json({ error: "価格を入力してください" }, { status: 400 });
  }

  const supabase = await createClient();
  if (supabase && !isMemoryStoreId(storeId)) {
    try {
      const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
      const storeOrganizerId = await getOrganizerIdByStoreId(supabase, storeId);
      if (!organizerId || storeOrganizerId !== organizerId) {
        if (getMemoryStoreById(storeId)) {
          const item = createMemoryStoreMenu(storeId, { ...input, name, priceYen });
          return NextResponse.json(item, { status: 201 });
        }
        return NextResponse.json({ error: "店舗が見つかりません" }, { status: 404 });
      }
      const item = await createStoreMenu(supabase, storeId, {
        ...input,
        name,
        priceYen,
      });
      return NextResponse.json(item, { status: 201 });
    } catch (e) {
      console.error("store menu POST:", e);
      if (getMemoryStoreById(storeId)) {
        const item = createMemoryStoreMenu(storeId, { ...input, name, priceYen });
        return NextResponse.json(item, { status: 201 });
      }
      return NextResponse.json(
        { error: "メニューの作成に失敗しました" },
        { status: 500 },
      );
    }
  }

  if (!getMemoryStoreById(storeId) && !isMemoryStoreId(storeId)) {
    return NextResponse.json({ error: "店舗が見つかりません" }, { status: 404 });
  }
  const item = createMemoryStoreMenu(storeId, { ...input, name, priceYen });
  return NextResponse.json(item, { status: 201 });
}
