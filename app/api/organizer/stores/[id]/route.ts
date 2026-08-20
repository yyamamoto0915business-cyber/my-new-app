import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import {
  fetchStoreById,
  getOrganizerIdByStoreId,
  updateStore,
} from "@/lib/db/stores";
import {
  getMemoryStoreById,
  updateMemoryStore,
} from "@/lib/stores/memory-store";
import { isStoreSampleId } from "@/lib/stores/draft-shell";
import {
  isStoreFeatureKey,
  normalizeStoreFeatures,
  type StoreIntroUpdateInput,
  type StoreStatus,
} from "@/lib/stores/types";

function isMemoryStoreId(id: string): boolean {
  return isStoreSampleId(id) || id.startsWith("store-mem-");
}

type Params = { params: Promise<{ id: string }> };

function parsePatchBody(body: Record<string, unknown>): StoreIntroUpdateInput {
  const patch: StoreIntroUpdateInput = {};

  if (typeof body.name === "string") patch.name = body.name;
  if (body.category === null || typeof body.category === "string") {
    patch.category = body.category;
  }
  if (body.tagline === null || typeof body.tagline === "string") {
    patch.tagline = body.tagline;
  }
  if (body.description === null || typeof body.description === "string") {
    patch.description = body.description;
  }
  if (body.coverImageUrl === null || typeof body.coverImageUrl === "string") {
    patch.coverImageUrl = body.coverImageUrl;
  }
  if (Array.isArray(body.galleryImages)) {
    patch.galleryImages = body.galleryImages.filter(
      (x): x is string => typeof x === "string",
    );
  }
  if (Array.isArray(body.features)) {
    patch.features = normalizeStoreFeatures(
      body.features.filter((x) => isStoreFeatureKey(x) || typeof x === "string"),
    );
  }
  if (body.hoursLabel === null || typeof body.hoursLabel === "string") {
    patch.hoursLabel = body.hoursLabel;
  }
  if (
    body.status === "draft" ||
    body.status === "public" ||
    body.status === "private"
  ) {
    patch.status = body.status as StoreStatus;
  }
  if (body.address === null || typeof body.address === "string") {
    patch.address = body.address;
  }
  if (body.phone === null || typeof body.phone === "string") {
    patch.phone = body.phone;
  }
  if (body.seatsInfo === null || typeof body.seatsInfo === "string") {
    patch.seatsInfo = body.seatsInfo;
  }
  if (body.paymentMethods === null || typeof body.paymentMethods === "string") {
    patch.paymentMethods = body.paymentMethods;
  }
  if (body.accessNote === null || typeof body.accessNote === "string") {
    patch.accessNote = body.accessNote;
  }
  if (body.websiteUrl === null || typeof body.websiteUrl === "string") {
    patch.websiteUrl = body.websiteUrl;
  }

  return patch;
}

/** GET: 主催者用店舗1件 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const supabase = await createClient();
  if (supabase) {
    try {
      // 開発用メモリ ID のみメモリ側を返す（所有権チェック不要のデモ／ローカル作成分）
      if (isMemoryStoreId(id)) {
        const mem = getMemoryStoreById(id);
        if (mem) return NextResponse.json(mem);
        return NextResponse.json({ error: "店舗が見つかりません" }, { status: 404 });
      }

      const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
      const storeOrganizerId = await getOrganizerIdByStoreId(supabase, id);
      if (!organizerId || storeOrganizerId !== organizerId) {
        return NextResponse.json({ error: "店舗が見つかりません" }, { status: 404 });
      }
      const store = await fetchStoreById(supabase, id);
      if (!store) {
        return NextResponse.json({ error: "店舗が見つかりません" }, { status: 404 });
      }
      return NextResponse.json(store);
    } catch (e) {
      console.error("organizer stores/[id] GET:", e);
      if (isMemoryStoreId(id)) {
        const mem = getMemoryStoreById(id);
        if (mem) return NextResponse.json(mem);
      }
      return NextResponse.json(
        { error: "店舗の取得に失敗しました" },
        { status: 500 },
      );
    }
  }

  const store = getMemoryStoreById(id);
  if (!store) {
    return NextResponse.json({ error: "店舗が見つかりません" }, { status: 404 });
  }
  return NextResponse.json(store);
}

/** PATCH: 店舗更新 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
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

  const patch = parsePatchBody(body);

  const supabase = await createClient();
  if (supabase) {
    try {
      if (id === "demo" || id.startsWith("demo-") || id.startsWith("store-mem-")) {
        const updated = updateMemoryStore(id, patch);
        if (!updated) {
          return NextResponse.json({ error: "店舗が見つかりません" }, { status: 404 });
        }
        return NextResponse.json(updated);
      }

      const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
      const storeOrganizerId = await getOrganizerIdByStoreId(supabase, id);
      if (!organizerId || storeOrganizerId !== organizerId) {
        const mem = updateMemoryStore(id, patch);
        if (mem) return NextResponse.json(mem);
        return NextResponse.json({ error: "店舗が見つかりません" }, { status: 404 });
      }
      const updated = await updateStore(supabase, id, patch);
      if (!updated) {
        return NextResponse.json({ error: "店舗が見つかりません" }, { status: 404 });
      }
      return NextResponse.json(updated);
    } catch (e) {
      console.error("organizer stores/[id] PATCH:", e);
      const mem = updateMemoryStore(id, patch);
      if (mem) return NextResponse.json(mem);
      return NextResponse.json(
        { error: "店舗の更新に失敗しました" },
        { status: 500 },
      );
    }
  }

  const updated = updateMemoryStore(id, patch);
  if (!updated) {
    return NextResponse.json({ error: "店舗が見つかりません" }, { status: 404 });
  }
  return NextResponse.json(updated);
}
