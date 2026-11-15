/** iOS アプリの WKWebView に付与する User-Agent トークン（capacitor.config と一致） */
export const IOS_APP_UA_TOKEN = "MachiGlyphApp";

export const NATIVE_AUTH_CALLBACK = "jp.machiglyph.app://auth/callback";

type CapacitorBridge = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
};

function capacitorBridge(): CapacitorBridge | null {
  if (typeof window === "undefined") return null;
  const cap = (window as Window & { Capacitor?: CapacitorBridge }).Capacitor;
  return cap ?? null;
}

export function isIosAppUserAgent(userAgent: string | null | undefined): boolean {
  return Boolean(userAgent?.includes(IOS_APP_UA_TOKEN));
}

/** Capacitor の iOS アプリ内かどうか。ブラウザでは false。 */
export function isIosAppShell(): boolean {
  if (typeof window === "undefined") return false;
  if (isIosAppUserAgent(navigator.userAgent)) return true;
  const cap = capacitorBridge();
  return Boolean(cap?.isNativePlatform?.() && cap.getPlatform?.() === "ios");
}

export function nativeAuthRedirect(returnTo: string): string {
  if (returnTo.startsWith("/") && returnTo !== "/" && !returnTo.startsWith("//")) {
    return `${NATIVE_AUTH_CALLBACK}?next=${encodeURIComponent(returnTo)}`;
  }
  return NATIVE_AUTH_CALLBACK;
}

const APP_SCHEME = "jp.machiglyph.app://";
/** アプリの中でそのまま開く画面（apple-app-site-association と同じ一覧） */
const IN_APP_LINK = /^\/team\/join\/[A-Za-z0-9_-]{8,128}\/?$/;

/**
 * アプリで開くリンクのうち、アプリの中で開く画面の道。それ以外は null。
 * https://www.machiglyph.jp/team/join/… （Universal Link）と、jp.machiglyph.app://team/join/… （「アプリで開く」ボタン）の両方を受ける。
 */
export function inAppLinkPath(url: string): string | null {
  if (url.startsWith(APP_SCHEME)) {
    const path = "/" + url.slice(APP_SCHEME.length).split(/[?#]/)[0];
    return IN_APP_LINK.test(path) ? path : null;
  }
  try {
    const parsed = new URL(url);
    const hostOk = parsed.protocol === "https:" && (parsed.hostname === "www.machiglyph.jp" || parsed.hostname === "machiglyph.jp");
    if (!hostOk) return null;
    return IN_APP_LINK.test(parsed.pathname) ? parsed.pathname : null;
  } catch {
    return null;
  }
}

/** ブラウザから「アプリで開く」ためのアドレス（LINE の中のブラウザからでもアプリが開く）。 */
export function appSchemeLink(path: string): string {
  return APP_SCHEME + path.replace(/^\/+/, "");
}

/** iPhone・iPad のブラウザ（アプリの中ではない）かどうか。 */
export function isIosBrowser(): boolean {
  if (typeof window === "undefined" || isIosAppShell()) return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

export function safeInAppPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}
