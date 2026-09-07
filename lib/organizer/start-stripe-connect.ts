export type StripeConnectReturnTo = "pos" | "payouts";

export const STRIPE_CONNECT_MISMATCH_CODE = "stripe_connect_mismatch";

export class StripeConnectStartError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "StripeConnectStartError";
    this.code = code;
  }
}

export function isStripeConnectMismatchError(error: unknown): boolean {
  if (error instanceof StripeConnectStartError) {
    return error.code === STRIPE_CONNECT_MISMATCH_CODE;
  }
  if (typeof error === "string") {
    return error.includes("秘密鍵（本番/テスト）と一致しません");
  }
  return false;
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new StripeConnectStartError("サーバーからの応答を読み取れませんでした。");
  }
}

function errorMessage(payload: Record<string, unknown>, fallback: string): string {
  return typeof payload.error === "string" && payload.error.trim()
    ? payload.error
    : fallback;
}

function throwFromPayload(payload: Record<string, unknown>, fallback: string): never {
  const code = typeof payload.code === "string" ? payload.code : undefined;
  throw new StripeConnectStartError(errorMessage(payload, fallback), code);
}

/** Stripe Connect の初期設定ページを開始し、遷移先 URL を返す */
export async function startStripeConnectOnboarding(
  returnTo: StripeConnectReturnTo = "payouts"
): Promise<string> {
  const createRes = await fetch("/api/connect/create-account", { method: "POST" });
  const createJson = await readJson(createRes);
  if (!createRes.ok) {
    throwFromPayload(createJson, "Stripe連携アカウントの作成に失敗しました");
  }

  const onboardRes = await fetch("/api/connect/onboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returnTo }),
  });
  const onboardJson = await readJson(onboardRes);
  if (!onboardRes.ok) {
    throwFromPayload(onboardJson, "Stripe初期設定ページの起動に失敗しました");
  }

  const url = onboardJson.url;
  if (typeof url !== "string" || !url) {
    throw new StripeConnectStartError("設定ページのURLを取得できませんでした");
  }
  return url;
}

/** 古い連携を消してから、いまの環境で設定を始める */
export async function resetAndStartStripeConnectOnboarding(
  returnTo: StripeConnectReturnTo = "payouts"
): Promise<string> {
  const resetRes = await fetch("/api/connect/reset", { method: "POST" });
  const resetJson = await readJson(resetRes);
  if (!resetRes.ok) {
    throwFromPayload(resetJson, "連携のやり直しに失敗しました");
  }
  return startStripeConnectOnboarding(returnTo);
}
