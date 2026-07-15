/**
 * Cloudflare Turnstile のサーバー検証。
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY / TURNSTILE_SECRET_KEY が両方あるときのみ必須。
 */

export function isTurnstileConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() &&
      process.env.TURNSTILE_SECRET_KEY?.trim()
  );
}

export async function verifyTurnstileToken(
  token: string | undefined,
  remoteip?: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isTurnstileConfigured()) {
    return { ok: true };
  }

  const trimmed = (token ?? "").trim();
  if (!trimmed) {
    return {
      ok: false,
      message: "認証の確認が完了していません。もう一度お試しください。",
    };
  }

  const secret = process.env.TURNSTILE_SECRET_KEY!.trim();

  try {
    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", trimmed);
    if (remoteip && remoteip !== "unknown") {
      body.set("remoteip", remoteip);
    }

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!res.ok) {
      console.error("[turnstile] siteverify HTTP", res.status);
      return {
        ok: false,
        message: "認証の確認に失敗しました。しばらくしてからもう一度お試しください。",
      };
    }

    const data = (await res.json()) as { success?: boolean };
    if (!data.success) {
      return {
        ok: false,
        message: "認証の確認に失敗しました。もう一度お試しください。",
      };
    }

    return { ok: true };
  } catch (err) {
    console.error("[turnstile] verify error", err);
    return {
      ok: false,
      message: "認証の確認に失敗しました。しばらくしてからもう一度お試しください。",
    };
  }
}
