export type ParsedCheckinQr =
  | { type: "token"; token: string }
  | { type: "code"; code: string }
  /** ゲームの参加用QR（/play/…）とスポットQR（/play/spot/…）。移動先はこのアプリ内のパスだけ。 */
  | { type: "play"; path: string };

/** QRコードの内容からチェックイン先（トークン or 受付コード or ゲーム）を解釈する */
export function parseCheckinQr(raw: string): ParsedCheckinQr | null {
  const text = raw.trim();
  if (!text) return null;

  const pathMatch = text.match(/\/checkin\/t\/([A-Za-z0-9]+)/);
  if (pathMatch) return { type: "token", token: pathMatch[1] };

  const spotMatch = text.match(/\/play\/spot\/([A-Za-z0-9_-]{8,64})(?=[/?#]|$)/);
  if (spotMatch) return { type: "play", path: `/play/spot/${spotMatch[1]}` };

  const joinMatch = text.match(/\/play\/([A-Za-z0-9_-]{8,64})(?=[/?#]|$)/);
  if (joinMatch) return { type: "play", path: `/play/${joinMatch[1]}` };

  if (/^[a-f0-9]{20}$/i.test(text)) return { type: "token", token: text };

  if (/^[A-Z0-9]{6}$/i.test(text)) return { type: "code", code: text.toUpperCase() };

  return null;
}
