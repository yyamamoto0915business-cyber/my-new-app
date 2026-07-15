/**
 * 新規登録の簡易レート制限（プロセス内メモリ）。
 * マルチインスタンスでは厳密ではないが、単体ボットの連打抑制には有効。
 */

type Bucket = { count: number; resetAt: number };

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_IP = 5;
const MAX_PER_EMAIL = 3;

const byIp = new Map<string, Bucket>();
const byEmail = new Map<string, Bucket>();

function take(map: Map<string, Bucket>, key: string, max: number): boolean {
  const now = Date.now();
  const current = map.get(key);
  if (!current || now >= current.resetAt) {
    map.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (current.count >= max) return false;
  current.count += 1;
  return true;
}

/** 古いバケットを間欠的に掃除（メモリ肥大化防止） */
function maybePrune(map: Map<string, Bucket>) {
  if (map.size < 500) return;
  const now = Date.now();
  for (const [key, bucket] of map) {
    if (now >= bucket.resetAt) map.delete(key);
  }
}

export function checkSignupRateLimit(opts: {
  ip: string;
  email: string;
}): { ok: true } | { ok: false; message: string } {
  const ip = opts.ip.trim() || "unknown";
  const email = opts.email.trim().toLowerCase();

  maybePrune(byIp);
  maybePrune(byEmail);

  const ipOk = take(byIp, ip, MAX_PER_IP);
  const emailOk = take(byEmail, email, MAX_PER_EMAIL);

  if (!ipOk || !emailOk) {
    return {
      ok: false,
      message: "登録の試行が多すぎます。しばらく時間をおいてから、もう一度お試しください。",
    };
  }
  return { ok: true };
}

export function getRequestIpFromHeaders(headerList: Headers): string {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headerList.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}
