import { NextResponse } from "next/server";
import { getStoreForPublicPage } from "@/lib/stores/get-store-for-public-page";
import { storeMenuRecordsToItems } from "@/lib/stores/demo-menu";

type Params = { params: Promise<{ id: string }> };

/** GET: 公開店舗詳細 */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const data = await getStoreForPublicPage(id);
  if (!data || data.store.status !== "public") {
    return NextResponse.json({ error: "店舗が見つかりません" }, { status: 404 });
  }
  return NextResponse.json({
    store: data.store,
    news: data.news.filter((n) => n.status === "public"),
    menu: storeMenuRecordsToItems(
      data.menu.filter((m) => m.status === "public"),
    ),
    events: data.events,
    schedules: data.schedules,
  });
}
