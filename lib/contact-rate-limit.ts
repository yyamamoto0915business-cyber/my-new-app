/**
 * ログインしていない人のお問い合わせの簡易レート制限（プロセス内メモリ）。
 * signup-rate-limit と同じく、単体ボットの連投を抑えるためのもの。
 */

type Bucket = { count: number; resetAt: number };

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_IP = 5;

const byIp = new Map<string, Bucket>();

export function checkGuestContactRateLimit(ip: string): boolean {
  const key = ip.trim() || "unknown";
  const now = Date.now();
  if (byIp.size >= 500) {
    for (const [k, bucket] of byIp) {
      if (now >= bucket.resetAt) byIp.delete(k);
    }
  }
  const current = byIp.get(key);
  if (!current || now >= current.resetAt) {
    byIp.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (current.count >= MAX_PER_IP) return false;
  current.count += 1;
  return true;
}
