import type { CapacitorConfig } from "@capacitor/cli";

/**
 * 一般向け iOS アプリ。画面は https://www.machiglyph.jp を開く。
 * レジ用アプリ（apps/pos-tap）とは別の Bundle ID。
 *
 * ストア提出前に Apple Developer 側で必要なもの:
 * - Bundle ID jp.machiglyph.app（Sign in with Apple、Push Notifications）
 * - Supabase の Redirect URLs に jp.machiglyph.app://auth/callback
 * - Supabase の Apple プロバイダ（Bundle ID と Services ID）
 * - APNs キー（APNS_KEY_ID / APNS_PRIVATE_KEY / APPLE_TEAM_ID）
 */
const config: CapacitorConfig = {
  appId: "jp.machiglyph.app",
  appName: "MachiGlyph",
  webDir: "mobile/www",
  server: {
    url: "https://www.machiglyph.jp",
    cleartext: false,
    allowNavigation: ["www.machiglyph.jp", "machiglyph.jp", "*.supabase.co"],
  },
  ios: {
    // 上の余白は Web 側の env(safe-area-inset-top) で取るので、アプリ側では足さない
    contentInset: "never",
    appendUserAgent: "MachiGlyphApp",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#f3f4f1",
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
