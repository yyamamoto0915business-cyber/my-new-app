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

export function safeInAppPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}
