export type ParsedCheckinQr =
  | { type: "token"; token: string }
  | { type: "code"; code: string };

/** QRコードの内容からチェックイン先（トークン or 受付コード）を解釈する */
export function parseCheckinQr(raw: string): ParsedCheckinQr | null {
  const text = raw.trim();
  if (!text) return null;

  const pathMatch = text.match(/\/checkin\/t\/([A-Za-z0-9]+)/);
  if (pathMatch) return { type: "token", token: pathMatch[1] };

  if (/^[a-f0-9]{20}$/i.test(text)) return { type: "token", token: text };

  if (/^[A-Z0-9]{6}$/i.test(text)) return { type: "code", code: text.toUpperCase() };

  return null;
}
