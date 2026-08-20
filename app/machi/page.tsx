import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "まちの情報 | MachiGlyph",
  description: "地域のイベント・店舗・ボランティア募集など、まちの情報を探せます。",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** 旧まち情報ハブ → まちの情報ホームへ集約 */
export default async function MachiPage({ searchParams }: Props) {
  const params = await searchParams;
  const kindRaw = params.kind;
  const kind = Array.isArray(kindRaw) ? kindRaw[0] : kindRaw;

  if (kind === "volunteer") {
    redirect("/?kind=volunteer");
  }
  if (kind === "store") {
    redirect("/?kind=store");
  }
  redirect("/");
}
