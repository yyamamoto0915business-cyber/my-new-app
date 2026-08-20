import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { getOrganizerIdByStoreId } from "@/lib/db/stores";
import { createStoreNews, listStoreNewsByStoreId } from "@/lib/db/store-news";
import {
  createMemoryStoreNews,
  listMemoryStoreNews,
} from "@/lib/stores/memory-news";
import { getMemoryStoreById } from "@/lib/stores/memory-store";
import {
  isStoreNewsCategory,
  isStoreNewsStatus,
  normalizeStoreDateInput,
  type StoreNewsInput,
} from "@/lib/stores/types";

type Params = { params: Promise<{ id: string }> };

function isMemoryStoreId(id: string): boolean {
  return id === "demo" || id.startsWith("demo-") || id.startsWith("store-mem-");
}

function parseNewsBody(body: Record<string, unknown>): StoreNewsInput & {
  title?: string;
} {
  const input: StoreNewsInput & { title?: string } = {};
  if (typeof body.title === "string") input.title = body.title;
  if (body.excerpt === null || typeof body.excerpt === "string") {
    input.excerpt = body.excerpt;
  }
  if (body.body === null || typeof body.body === "string") {
    input.body = body.body;
  }
  if (body.thumbnailUrl === null || typeof body.thumbnailUrl === "string") {
    input.thumbnailUrl = body.thumbnailUrl;
  }
  if (isStoreNewsCategory(body.category)) input.category = body.category;
  if (body.periodStart !== undefined) {
    input.periodStart = normalizeStoreDateInput(body.periodStart);
  }
  if (body.periodEnd !== undefined) {
    input.periodEnd = normalizeStoreDateInput(body.periodEnd);
  }
  if (isStoreNewsStatus(body.status)) input.status = body.status;
  return input;
}

/** GET: 店舗のニュース一覧 */
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
          return NextResponse.json({ news: listMemoryStoreNews(storeId) });
        }
        return NextResponse.json({ error: "店舗が見つかりません" }, { status: 404 });
      }
      const news = await listStoreNewsByStoreId(supabase, storeId);
      return NextResponse.json({ news });
    } catch (e) {
      console.error("store news GET:", e);
      if (getMemoryStoreById(storeId)) {
        return NextResponse.json({ news: listMemoryStoreNews(storeId) });
      }
      return NextResponse.json(
        { error: "ニュースの取得に失敗しました" },
        { status: 500 },
      );
    }
  }

  if (!getMemoryStoreById(storeId) && !isMemoryStoreId(storeId)) {
    return NextResponse.json({ error: "店舗が見つかりません" }, { status: 404 });
  }
  return NextResponse.json({ news: listMemoryStoreNews(storeId) });
}

/** POST: ニュース作成 */
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

  const input = parseNewsBody(body);
  const title = input.title?.trim() ?? "";
  if (!title) {
    return NextResponse.json({ error: "タイトルは必須です" }, { status: 400 });
  }

  const supabase = await createClient();
  if (supabase && !isMemoryStoreId(storeId)) {
    try {
      const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
      const storeOrganizerId = await getOrganizerIdByStoreId(supabase, storeId);
      if (!organizerId || storeOrganizerId !== organizerId) {
        if (getMemoryStoreById(storeId)) {
          const news = createMemoryStoreNews(storeId, { ...input, title });
          return NextResponse.json(news, { status: 201 });
        }
        return NextResponse.json({ error: "店舗が見つかりません" }, { status: 404 });
      }
      const news = await createStoreNews(supabase, storeId, { ...input, title });
      return NextResponse.json(news, { status: 201 });
    } catch (e) {
      console.error("store news POST:", e);
      if (getMemoryStoreById(storeId)) {
        const news = createMemoryStoreNews(storeId, { ...input, title });
        return NextResponse.json(news, { status: 201 });
      }
      return NextResponse.json(
        { error: "ニュースの作成に失敗しました" },
        { status: 500 },
      );
    }
  }

  if (!getMemoryStoreById(storeId) && !isMemoryStoreId(storeId)) {
    return NextResponse.json({ error: "店舗が見つかりません" }, { status: 404 });
  }
  const news = createMemoryStoreNews(storeId, { ...input, title });
  return NextResponse.json(news, { status: 201 });
}
