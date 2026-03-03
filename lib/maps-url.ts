/**
 * 地図URL生成ヘルパー
 * - 住所/会場名があれば検索URLを生成
 * - 緯度経度がある場合は lat,lng を優先
 * - iOS: Apple Maps、それ以外: Google Maps（UAで判定）
 */

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/** Google Maps の検索URL */
export function buildGoogleMapsUrl(
  query: string,
  lat?: number,
  lng?: number
): string {
  if (lat != null && lng != null) {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Apple Maps の検索URL */
export function buildAppleMapsUrl(
  query: string,
  lat?: number,
  lng?: number
): string {
  if (lat != null && lng != null) {
    return `https://maps.apple.com/?ll=${lat},${lng}`;
  }
  return `https://maps.apple.com/?q=${encodeURIComponent(query)}`;
}

export type MapsUrlOptions = {
  /** 住所（必須。緯度経度がない場合の検索クエリにも使用） */
  address: string;
  /** 会場名（location。住所と併用で検索精度向上） */
  venueName?: string;
  latitude?: number;
  longitude?: number;
  /** 明示的にiOS扱いする場合（省略時はUAで自動判定） */
  preferIOS?: boolean;
};

/**
 * UAに応じて地図URLを生成。
 * iOS → Apple Maps、その他 → Google Maps
 */
export function getMapsUrl(options: MapsUrlOptions): string {
  const { address, venueName, latitude, longitude } = options;
  const preferIOS = options.preferIOS ?? isIOS();

  if (latitude != null && longitude != null) {
    const url = preferIOS
      ? buildAppleMapsUrl("", latitude, longitude)
      : buildGoogleMapsUrl("", latitude, longitude);
    return url;
  }

  const query = venueName && address ? `${venueName} ${address}` : venueName || address || "";
  if (!query) return "https://www.google.com/maps";

  return preferIOS
    ? buildAppleMapsUrl(query)
    : buildGoogleMapsUrl(query);
}

/**
 * 地図を開く（window.open 用）
 */
export function openMaps(
  options: MapsUrlOptions,
  target: "_blank" | "_self" = "_blank"
): void {
  const url = getMapsUrl(options);
  window.open(url, target, "noopener,noreferrer");
}
