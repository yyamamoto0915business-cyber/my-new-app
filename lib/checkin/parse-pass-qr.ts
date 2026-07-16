export type ParsedPassQr =
  | { type: "participant"; participantId: string }
  | { type: "reception"; receptionNumber: string };

/** 参加パスQR / 受付番号から参加者キーを解釈する */
export function parsePassQr(raw: string): ParsedPassQr | null {
  const text = raw.trim();
  if (!text) return null;

  const mgPass = text.match(/^mg-pass:([0-9a-f-]{36})$/i);
  if (mgPass) {
    return { type: "participant", participantId: mgPass[1].toLowerCase() };
  }

  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text)
  ) {
    return { type: "participant", participantId: text.toLowerCase() };
  }

  const reception = text.match(/^MG-([A-Z0-9]{8})$/i);
  if (reception) {
    return { type: "reception", receptionNumber: `MG-${reception[1].toUpperCase()}` };
  }

  return null;
}

/** participantId から表示用受付番号を生成（参加パスと同一規則） */
export function buildReceptionNumber(participantId: string): string {
  const short = participantId.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `MG-${short}`;
}
