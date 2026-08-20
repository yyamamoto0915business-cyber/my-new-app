import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { getOrganizerIdByStoreId } from "@/lib/db/stores";
import {
  deleteStoreNews,
  fetchStoreNewsById,
  updateStoreNews,
} from "@/lib/db/store-news";
import {
  deleteMemoryStoreNews,
  getMemoryStoreNewsById,
  updateMemoryStoreNews,
} from "@/lib/stores/memory-news";
import { getMemoryStoreById } from "@/lib/stores/memory-store";
import {
  isStoreNewsCategory,
  isStoreNewsStatus,
  normalizeStoreDateInput,
  type StoreNewsInput,
} from "@/lib/stores/types";

type Params = { params: Promise<{ id: string; newsId: string }> };

function isMemoryStoreId(id: string): boolean {
  return id === "demo" || id.startsWith("demo-") || id.startsWith("store-mem-");
}

function parseNewsBody(body: Record<string, unknown>): StoreNewsInput {
  const input: StoreNewsInput = {};
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

/** GET: ニュース1件 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id: storeId, newsId } = await params;
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
        const mem = getMemoryStoreNewsById(storeId, newsId);
        if (mem) return NextResponse.json(mem);
        return NextResponse.json({ error: "ニュースが見つかりません" }, { status: 404 });
      }
      const news = await fetchStoreNewsById(supabase, storeId, newsId);
      if (!news) {
        return NextResponse.json({ error: "ニュースが見つかりません" }, { status: 404 });
      }
      return NextResponse.json(news);
    } catch (e) {
      console.error("store news/[newsId] GET:", e);
      const mem = getMemoryStoreNewsById(storeId, newsId);
      if (mem) return NextResponse.json(mem);
      return NextResponse.json(
        { error: "ニュースの取得に失敗しました" },
        { status: 500 },
      );
    }
  }

  const news = getMemoryStoreNewsById(storeId, newsId);
  if (!news) {
    return NextResponse.json({ error: "ニュースが見つかりません" }, { status: 404 });
  }
  return NextResponse.json(news);
}

/** PATCH: ニュース更新 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id: storeId, newsId } = await params;
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

  const patch = parseNewsBody(body);

  const supabase = await createClient();
  if (supabase && !isMemoryStoreId(storeId)) {
    try {
      const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
      const storeOrganizerId = await getOrganizerIdByStoreId(supabase, storeId);
      if (!organizerId || storeOrganizerId !== organizerId) {
        const mem = updateMemoryStoreNews(storeId, newsId, patch);
        if (mem) return NextResponse.json(mem);
        return NextResponse.json({ error: "ニュースが見つかりません" }, { status: 404 });
      }
      const updated = await updateStoreNews(supabase, storeId, newsId, patch);
      if (!updated) {
        return NextResponse.json({ error: "ニュースが見つかりません" }, { status: 404 });
      }
      return NextResponse.json(updated);
    } catch (e) {
      console.error("store news/[newsId] PATCH:", e);
      const mem = updateMemoryStoreNews(storeId, newsId, patch);
      if (mem) return NextResponse.json(mem);
      return NextResponse.json(
        { error: "ニュースの更新に失敗しました" },
        { status: 500 },
      );
    }
  }

  const updated = updateMemoryStoreNews(storeId, newsId, patch);
  if (!updated) {
    return NextResponse.json({ error: "ニュースが見つかりません" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

/** DELETE: ニュース削除 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id: storeId, newsId } = await params;
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
        if (getMemoryStoreById(storeId) && deleteMemoryStoreNews(storeId, newsId)) {
          return NextResponse.json({ ok: true });
        }
        return NextResponse.json({ error: "ニュースが見つかりません" }, { status: 404 });
      }
      const ok = await deleteStoreNews(supabase, storeId, newsId);
      if (!ok) {
        return NextResponse.json({ error: "ニュースが見つかりません" }, { status: 404 });
      }
      return NextResponse.json({ ok: true });
    } catch (e) {
      console.error("store news/[newsId] DELETE:", e);
      if (deleteMemoryStoreNews(storeId, newsId)) {
        return NextResponse.json({ ok: true });
      }
      return NextResponse.json(
        { error: "ニュースの削除に失敗しました" },
        { status: 500 },
      );
    }
  }

  if (!deleteMemoryStoreNews(storeId, newsId)) {
    return NextResponse.json({ error: "ニュースが見つかりません" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
