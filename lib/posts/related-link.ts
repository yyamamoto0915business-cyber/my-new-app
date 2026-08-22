export type RelatedLinkKind = "map" | "site" | "internal";

function tryParseUrl(href: string): URL | null {
  const trimmed = href.trim();
  if (!trimmed) return null;
  try {
    if (trimmed.startsWith("/")) {
      return new URL(trimmed, "https://machiglyph.local");
    }
    return new URL(trimmed);
  } catch {
    return null;
  }
}

function hostnameOf(url: URL): string {
  return url.hostname.replace(/^www\./i, "").toLowerCase();
}

export function classifyRelatedHref(href: string): RelatedLinkKind {
  const trimmed = href.trim();
  if (trimmed.startsWith("/")) return "internal";

  const url = tryParseUrl(trimmed);
  if (!url) return "site";
  if (url.protocol !== "http:" && url.protocol !== "https:") return "site";

  const host = hostnameOf(url);
  const path = url.pathname.toLowerCase();
  const isGoogle =
    host === "google.com" ||
    host === "google.co.jp" ||
    host.endsWith(".google.com") ||
    host.endsWith(".google.co.jp");

  if (
    host === "maps.app.goo.gl" ||
    host === "goo.gl" ||
    host === "maps.google.com" ||
    host === "maps.google.co.jp" ||
    (isGoogle && (path.includes("/maps") || path === "/maps"))
  ) {
    return "map";
  }

  return "site";
}

export function isExternalRelatedHref(href: string): boolean {
  return classifyRelatedHref(href) !== "internal";
}

export function relatedLinkTitle(kind: RelatedLinkKind): string {
  if (kind === "map") return "この場所について";
  return "関連リンク";
}

export function relatedLinkCtaLabel(kind: RelatedLinkKind): string {
  if (kind === "map") return "マップで見る";
  if (kind === "internal") return "くわしく見る";
  return "サイトを開く";
}

export function relatedLinkHostLabel(href: string): string {
  const url = tryParseUrl(href.trim());
  if (!url) return href.trim();
  if (href.trim().startsWith("/")) return "MachiGlyph";
  return hostnameOf(url) || href.trim();
}

/** iframe 用。短い共有リンクなどクエリが取れない場合は null */
export function buildMapsEmbedUrl(
  href: string,
  fallbackQuery?: string,
): string | null {
  const url = tryParseUrl(href.trim());
  let query = "";

  if (url && classifyRelatedHref(href) === "map") {
    query =
      url.searchParams.get("query") ||
      url.searchParams.get("q") ||
      "";

    if (!query) {
      const place = url.pathname.match(/\/maps\/place\/([^/]+)/i);
      if (place?.[1]) {
        try {
          query = decodeURIComponent(place[1].replace(/\+/g, " "));
        } catch {
          query = place[1];
        }
      }
    }

    if (!query) {
      const at = url.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (at) query = `${at[1]},${at[2]}`;
    }
  }

  if (!query) query = fallbackQuery?.trim() ?? "";
  if (!query) return null;

  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=ja&z=15&output=embed`;
}
