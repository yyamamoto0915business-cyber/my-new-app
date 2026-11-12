/**
 * 「レジで見せるQR」（イベントポイント用）の形。画面（読み取り）でもサーバーでも使うので、ここには秘密を入れない。
 * 形：mg-pts:<ユーザーID>:<イベントID>:<署名>
 * 署名はサーバーだけが作れる（lib/points/points-qr.ts）。参加申し込みをせずにゲームだけ遊んだ人も、これでレジで使える。
 */
export const POINTS_QR_PATTERN =
  /^mg-pts:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}):([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}):([A-Za-z0-9_-]{16,64})$/i;

export function looksLikePointsQr(raw: string): boolean {
  return POINTS_QR_PATTERN.test(raw.trim());
}
