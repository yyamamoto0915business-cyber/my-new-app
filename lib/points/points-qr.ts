import { createHmac, timingSafeEqual } from "node:crypto";
import { POINTS_QR_PATTERN } from "@/lib/points/points-qr-format";

/**
 * 「レジで見せるQR」の署名（サーバーだけ）。ユーザーIDを知っているだけではQRを作れないようにする。
 * 鍵は POINTS_QR_SECRET。なければ SUPABASE_SERVICE_ROLE_KEY から作る。
 */
function secret(): string | null {
  return process.env.POINTS_QR_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
}

function sign(userId: string, eventId: string, key: string): string {
  return createHmac("sha256", key)
    .update(`event-points-qr:${userId.toLowerCase()}:${eventId.toLowerCase()}`)
    .digest("base64url")
    .slice(0, 22);
}

/** 本人の、あるイベントのポイント用QRの中身。鍵がなければ null */
export function buildPointsQr(userId: string, eventId: string): string | null {
  const key = secret();
  if (!key) return null;
  return `mg-pts:${userId.toLowerCase()}:${eventId.toLowerCase()}:${sign(userId, eventId, key)}`;
}

/** QRを確かめて、正しければユーザーIDとイベントIDを返す */
export function verifyPointsQr(raw: string): { userId: string; eventId: string } | null {
  const m = raw.trim().match(POINTS_QR_PATTERN);
  const key = secret();
  if (!m || !key) return null;
  const [, userId, eventId, sig] = m;
  const want = Buffer.from(sign(userId, eventId, key));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  return { userId: userId.toLowerCase(), eventId: eventId.toLowerCase() };
}
