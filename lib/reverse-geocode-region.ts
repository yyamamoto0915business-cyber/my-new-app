import { PREFECTURES } from "@/lib/prefectures";

export type ReverseGeocodeResult = {
  prefecture: string;
  city: string;
};

/** 緯度経度から都道府県・市区町村を推定（OpenStreetMap Nominatim） */
export async function reverseGeocodeRegion(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");
  url.searchParams.set("accept-language", "ja");
  url.searchParams.set("zoom", "10");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "MachiGlyph/1.0 (region-setting)" },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    address?: Record<string, string>;
  };
  const addr = data.address;
  if (!addr) return null;

  const rawState =
    addr.state ?? addr.province ?? addr["ISO3166-2-lvl4"] ?? "";
  const prefecture = matchPrefecture(rawState);
  if (!prefecture) return null;

  const city =
    addr.city ??
    addr.town ??
    addr.village ??
    addr.municipality ??
    addr.county ??
    "";

  return { prefecture, city: city.trim() };
}

function matchPrefecture(raw: string): string | null {
  const normalized = raw.trim();
  if (!normalized) return null;
  const direct = PREFECTURES.find((p) => normalized.includes(p) || p.includes(normalized));
  if (direct) return direct;
  // 「北海道」「東京」など短縮表記
  if (normalized.includes("北海道")) return "北海道";
  if (normalized.includes("東京")) return "東京都";
  if (normalized.includes("大阪")) return "大阪府";
  if (normalized.includes("京都")) return "京都府";
  return null;
}
