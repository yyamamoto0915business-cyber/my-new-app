import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { getOrganizerIdByStoreId } from "@/lib/db/stores";
import { getMemoryStoreById } from "@/lib/stores/memory-store";
import { listStoreEventsForOrganizer } from "@/lib/stores/store-linked-events";

type Params = { params: Promise<{ id: string }> };

function isMemoryStoreId(id: string): boolean {
  return id === "demo" || id.startsWith("demo-") || id.startsWith("store-mem-");
}

/** GET: 店舗に紐づくイベント一覧（主催者） */
export async function GET(_request: Request, { params }: Params) {
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
          const events = await listStoreEventsForOrganizer(storeId);
          return NextResponse.json({ events });
        }
        return NextResponse.json({ error: "店舗が見つかりません" }, { status: 404 });
      }
    } catch (e) {
      console.error("store events auth:", e);
      if (!getMemoryStoreById(storeId)) {
        return NextResponse.json(
          { error: "イベントの取得に失敗しました" },
          { status: 500 },
        );
      }
    }
  } else if (!isMemoryStoreId(storeId) && !getMemoryStoreById(storeId)) {
    return NextResponse.json({ error: "店舗が見つかりません" }, { status: 404 });
  }

  const events = await listStoreEventsForOrganizer(storeId);
  return NextResponse.json({ events });
}
