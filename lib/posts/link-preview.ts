import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import {
  classifyRelatedHref,
  relatedLinkHostLabel,
} from "@/lib/posts/related-link";

const FETCH_TIMEOUT_MS = 5000;
const MAX_HTML_BYTES = 512_000;
const MAX_REDIRECTS = 4;

export type LinkPreviewResult = {
  url: string;
  kind: "map" | "site" | "internal";
  title: string;
  imageUrl: string;
  siteName: string;
};

function isBlockedIpv4(ip: string): boolean {
  const parts = ip.split(".").map((n) => Number(n));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return true;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

function isBlockedIp(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) return isBlockedIpv4(ip);
  if (v === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "::") return true;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
    if (lower.startsWith("fe80")) return true;
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isBlockedIpv4(mapped[1]);
  }
  return v === 0;
}

async function assertPublicHttpUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error("URLが不正です");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("http(s) のURLのみ利用できます");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host === "0.0.0.0"
  ) {
    throw new Error("このURLは利用できません");
  }
  if (isIP(host)) {
    if (isBlockedIp(host)) throw new Error("このURLは利用できません");
    return url;
  }
  const { address } = await lookup(host);
  if (isBlockedIp(address)) throw new Error("このURLは利用できません");
  return url;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) =>
      String.fromCharCode(parseInt(n, 16)),
    );
}

function metaContent(html: string, keys: string[]): string {
  for (const key of keys) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(
        `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`,
        "i",
      ),
      new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`,
        "i",
      ),
    ];
    for (const re of patterns) {
      const match = html.match(re);
      if (match?.[1]) return decodeEntities(match[1].trim());
    }
  }
  return "";
}

function parseHtmlPreview(html: string, pageUrl: URL): Omit<
  LinkPreviewResult,
  "url" | "kind"
> {
  const title =
    metaContent(html, ["og:title", "twitter:title"]) ||
    decodeEntities(
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? "",
    );
  let imageUrl =
    metaContent(html, ["og:image", "og:image:url", "twitter:image"]) || "";
  if (imageUrl) {
    try {
      imageUrl = new URL(imageUrl, pageUrl).toString();
    } catch {
      imageUrl = "";
    }
  }
  const siteName =
    metaContent(html, ["og:site_name"]) || relatedLinkHostLabel(pageUrl.href);
  return {
    title: title.slice(0, 180),
    imageUrl: imageUrl.slice(0, 2000),
    siteName: siteName.slice(0, 80),
  };
}

async function fetchFollowPublic(
  start: string,
): Promise<{ url: URL; response: Response }> {
  let current = await assertPublicHttpUrl(start);
  for (let i = 0; i <= MAX_REDIRECTS; i += 1) {
    const response = await fetch(current.href, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      response.body?.cancel();
      if (!location) throw new Error("リダイレクト先がありません");
      current = await assertPublicHttpUrl(new URL(location, current).href);
      continue;
    }
    return { url: current, response };
  }
  throw new Error("リダイレクトが多すぎます");
}

export function normalizeRelatedUrl(raw: string): string {
  const trimmed = raw.trim().slice(0, 2000);
  if (!trimmed) return "";
  if (trimmed.startsWith("/")) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.href;
  } catch {
    return "";
  }
}

export async function fetchRelatedLinkPreview(
  rawUrl: string,
): Promise<LinkPreviewResult | null> {
  const normalized = normalizeRelatedUrl(rawUrl);
  if (!normalized || normalized.startsWith("/")) return null;

  const kind = classifyRelatedHref(normalized);
  if (kind === "internal") return null;

  try {
    if (kind === "map") {
      const { url } = await fetchFollowPublic(normalized);
      const resolvedKind = classifyRelatedHref(url.href);
      return {
        url: url.href,
        kind: resolvedKind === "internal" ? "map" : resolvedKind,
        title: "",
        imageUrl: "",
        siteName: relatedLinkHostLabel(url.href),
      };
    }

    const { url, response } = await fetchFollowPublic(normalized);
    const type = response.headers.get("content-type") ?? "";
    if (!type.includes("text/html") && !type.includes("application/xhtml")) {
      response.body?.cancel();
      return {
        url: url.href,
        kind: "site",
        title: "",
        imageUrl: "",
        siteName: relatedLinkHostLabel(url.href),
      };
    }

    const buf = await response.arrayBuffer();
    const slice = buf.byteLength > MAX_HTML_BYTES ? buf.slice(0, MAX_HTML_BYTES) : buf;
    const html = new TextDecoder("utf-8", { fatal: false }).decode(slice);
    const parsed = parseHtmlPreview(html, url);

    let imageUrl = parsed.imageUrl;
    if (imageUrl) {
      try {
        await assertPublicHttpUrl(imageUrl);
      } catch {
        imageUrl = "";
      }
    }

    return {
      url: url.href,
      kind: classifyRelatedHref(url.href) === "map" ? "map" : "site",
      title: parsed.title,
      imageUrl,
      siteName: parsed.siteName,
    };
  } catch (e) {
    console.error("fetchRelatedLinkPreview:", e);
    return {
      url: normalized,
      kind,
      title: "",
      imageUrl: "",
      siteName: relatedLinkHostLabel(normalized),
    };
  }
}
