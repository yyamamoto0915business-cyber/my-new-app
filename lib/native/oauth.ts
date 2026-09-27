import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isIosAppShell, nativeAuthRedirect } from "@/lib/native/app-shell";

const APPLE_CLIENT_ID = "jp.machiglyph.app";
const APPLE_REDIRECT_URI = "https://www.machiglyph.jp/auth/callback";

function webRedirect(returnTo: string): string {
  const redirectTo = new URL("/auth/callback", window.location.origin);
  if (returnTo !== "/" && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
    redirectTo.searchParams.set("next", returnTo);
  }
  return redirectTo.toString();
}

function randomNonce(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function isAppleCancel(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /cancel/i.test(message) || message.includes("1001") || message.includes("1000");
}

/**
 * アプリ内では Apple のシステム画面でサインインし、Supabase に ID トークンを渡す。
 * プラグインが使えないときは false を返し、ブラウザの OAuth に落とす。
 */
async function signInWithAppleNative(
  supabase: SupabaseClient
): Promise<{ handled: boolean; error: string | null; signedIn: boolean }> {
  try {
    const { SignInWithApple } = await import("@capacitor-community/apple-sign-in");
    const rawNonce = randomNonce();
    const hashedNonce = await sha256Hex(rawNonce);
    const result = await SignInWithApple.authorize({
      clientId: APPLE_CLIENT_ID,
      redirectURI: APPLE_REDIRECT_URI,
      scopes: "email name",
      nonce: hashedNonce,
    });
    const identityToken = result.response.identityToken;
    if (!identityToken) {
      return { handled: true, error: "Appleのログインを完了できませんでした。", signedIn: false };
    }
    const { error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: identityToken,
      nonce: rawNonce,
    });
    if (error) {
      return {
        handled: true,
        error: "Appleのログインを完了できませんでした。しばらくしてからもう一度お試しください。",
        signedIn: false,
      };
    }
    return { handled: true, error: null, signedIn: true };
  } catch (err) {
    if (isAppleCancel(err)) return { handled: true, error: null, signedIn: false };
    console.warn("[apple-native]", err);
    return { handled: false, error: null, signedIn: false };
  }
}

export async function signInWithProvider(
  provider: "google" | "apple",
  returnTo: string
): Promise<{ error: string | null; signedIn: boolean }> {
  const supabase = createClient();
  if (!supabase) {
    return { error: "エラーが発生しました。しばらくしてからもう一度お試しください。", signedIn: false };
  }

  const inApp = isIosAppShell();
  if (provider === "apple" && inApp) {
    const native = await signInWithAppleNative(supabase);
    if (native.handled) return { error: native.error, signedIn: native.signedIn };
  }

  const redirectTo = inApp ? nativeAuthRedirect(returnTo) : webRedirect(returnTo);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: inApp,
    },
  });

  if (error || !data?.url) {
    const label = provider === "apple" ? "Apple" : "Google";
    return {
      error: `${label}ログインを開始できませんでした。しばらくしてからもう一度お試しください。`,
      signedIn: false,
    };
  }

  if (inApp) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url: data.url });
  }

  return { error: null, signedIn: false };
}
