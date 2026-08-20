import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { createStore, listStoresByOrganizerId } from "@/lib/db/stores";
import {
  createMemoryStore,
  listMemoryStores,
} from "@/lib/stores/memory-store";
import { isStoreKind, type StoreKind } from "@/lib/stores/types";

function parseKind(value: unknown): StoreKind | undefined {
  if (isStoreKind(value)) return value;
  return undefined;
}

/** GET: 主催者の店舗一覧（?kind=store|kitchen_car） */
export async function GET(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const kind = parseKind(request.nextUrl.searchParams.get("kind"));

  const supabase = await createClient();
  if (supabase) {
    try {
      const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
      if (!organizerId) {
        return NextResponse.json({ error: "主催者登録が必要です" }, { status: 403 });
      }
      const stores = await listStoresByOrganizerId(supabase, organizerId, kind);
      const mem = listMemoryStores(user.id, kind);
      const ids = new Set(stores.map((s) => s.id));
      const merged = [...stores, ...mem.filter((s) => !ids.has(s.id))];
      return NextResponse.json({ stores: merged });
    } catch (e) {
      console.error("organizer stores GET:", e);
      return NextResponse.json({ stores: listMemoryStores(user.id, kind) });
    }
  }

  return NextResponse.json({ stores: listMemoryStores(user.id, kind) });
}

/** POST: 店舗 / キッチンカーを新規作成 */
export async function POST(request: NextRequest) {
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

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "名前は必須です" }, { status: 400 });
  }

  const kind: StoreKind = parseKind(body.kind) ?? "store";

  const supabase = await createClient();
  if (supabase) {
    try {
      const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
      if (!organizerId) {
        return NextResponse.json({ error: "主催者登録が必要です" }, { status: 403 });
      }
      const store = await createStore(supabase, organizerId, {
        name,
        kind,
        category: typeof body.category === "string" ? body.category : null,
        tagline: typeof body.tagline === "string" ? body.tagline : null,
        description: typeof body.description === "string" ? body.description : null,
        coverImageUrl:
          typeof body.coverImageUrl === "string" ? body.coverImageUrl : null,
        hoursLabel: typeof body.hoursLabel === "string" ? body.hoursLabel : null,
        status: body.status === "public" ? "public" : "draft",
      });
      return NextResponse.json(store, { status: 201 });
    } catch (e) {
      console.error("organizer stores POST:", e);
      // kind 列未適用など DB 失敗時は開発用メモリへフォールバック
      const store = createMemoryStore(user.id, {
        name,
        kind,
        category: typeof body.category === "string" ? body.category : null,
        tagline: typeof body.tagline === "string" ? body.tagline : null,
        description: typeof body.description === "string" ? body.description : null,
        coverImageUrl:
          typeof body.coverImageUrl === "string" ? body.coverImageUrl : null,
        hoursLabel: typeof body.hoursLabel === "string" ? body.hoursLabel : null,
        status: body.status === "public" ? "public" : "draft",
      });
      return NextResponse.json(store, { status: 201 });
    }
  }

  const store = createMemoryStore(user.id, {
    name,
    kind,
    category: typeof body.category === "string" ? body.category : null,
    tagline: typeof body.tagline === "string" ? body.tagline : null,
    description: typeof body.description === "string" ? body.description : null,
    coverImageUrl:
      typeof body.coverImageUrl === "string" ? body.coverImageUrl : null,
    hoursLabel: typeof body.hoursLabel === "string" ? body.hoursLabel : null,
    status: body.status === "public" ? "public" : "draft",
  });
  return NextResponse.json(store, { status: 201 });
}
