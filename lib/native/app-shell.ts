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

/** アプリで開くリンクのうち、そのままアプリの中で開く画面（apple-app-site-association と同じ一覧）。それ以外は null */
export function inAppLinkPath(url: string): string | null {
  try {
    const parsed = new URL(url);
    const hostOk = parsed.protocol === "https:" && (parsed.hostname === "www.machiglyph.jp" || parsed.hostname === "machiglyph.jp");
    if (!hostOk) return null;
    // チームの招待リンク：/team/join/<トークン>
    if (/^\/team\/join\/[A-Za-z0-9_-]{8,128}\/?$/.test(parsed.pathname)) return parsed.pathname;
    return null;
  } catch {
    return null;
  }
}

export function safeInAppPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}
